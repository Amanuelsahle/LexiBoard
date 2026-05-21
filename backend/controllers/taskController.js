const pool = require("../config/db");

const columnExistsCache = {};

const hasColumn = async (table, column) => {
  const cacheKey = `${table}.${column}`;
  if (columnExistsCache[cacheKey] !== undefined)
    return columnExistsCache[cacheKey];

  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     LIMIT 1`,
    [table, column],
  );

  const exists = result.rowCount > 0;
  columnExistsCache[cacheKey] = exists;
  return exists;
};

const createBoardWithDefaultLists = async (userId, title = "My Board") => {
  const useActive = await hasColumn("boards", "is_active");
  const useUserId = await hasColumn("boards", "user_id");
  const insertBoardSql = useActive
    ? useUserId
      ? `INSERT INTO boards (title, user_id, is_active) VALUES ($1, $2, TRUE) RETURNING id, title;`
      : `INSERT INTO boards (title, is_active) VALUES ($1, TRUE) RETURNING id, title;`
    : useUserId
      ? `INSERT INTO boards (title, user_id) VALUES ($1, $2) RETURNING id, title;`
      : `INSERT INTO boards (title) VALUES ($1) RETURNING id, title;`;
  const boardResult = useUserId
    ? await pool.query(insertBoardSql, [title, userId])
    : await pool.query(insertBoardSql, [title]);

  const boardId = boardResult.rows[0].id;
  await pool.query(
    `INSERT INTO lists (title, position_index, user_id, board_id) VALUES 
      ('To Do', 1000.0, $1, $2),
      ('In Progress', 2000.0, $1, $2),
      ('Done', 3000.0, $1, $2);`,
    [userId, boardId],
  );

  return boardResult.rows[0];
};

const getActiveBoardForUser = async (userId) => {
  const useActive = await hasColumn("boards", "is_active");
  const useUserId = await hasColumn("boards", "user_id");

  if (useActive) {
    const activeBoard = useUserId
      ? await pool.query(
          "SELECT id, title FROM boards WHERE user_id = $1 AND is_active = TRUE LIMIT 1",
          [userId],
        )
      : await pool.query(
          `SELECT b.id, b.title
           FROM boards b
           WHERE b.is_active = TRUE AND EXISTS (SELECT 1 FROM lists l WHERE l.board_id = b.id AND l.user_id = $1)
           LIMIT 1`,
          [userId],
        );

    if (activeBoard.rowCount > 0) {
      return activeBoard.rows[0];
    }
  }

  const fallbackBoard = useUserId
    ? await pool.query(
        "SELECT id, title FROM boards WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1",
        [userId],
      )
    : await pool.query(
        `SELECT b.id, b.title
         FROM boards b
         WHERE EXISTS (SELECT 1 FROM lists l WHERE l.board_id = b.id AND l.user_id = $1)
         ORDER BY b.created_at ASC
         LIMIT 1`,
        [userId],
      );

  if (fallbackBoard.rowCount > 0) {
    return fallbackBoard.rows[0];
  }

  return null;
};

exports.reorderTask = async (req, res) => {
  const { id } = req.params;
  const { listId, prevPosition, nextPosition } = req.body;
  const userId = req.user.id;

  if (!listId) {
    return res.status(400).json({ error: "target listId is required." });
  }

  try {
    let newPosition;
    if (prevPosition === null && nextPosition !== null) {
      newPosition = nextPosition / 2;
    } else if (prevPosition !== null && nextPosition === null) {
      newPosition = prevPosition + 1000.0;
    } else if (prevPosition !== null && nextPosition !== null) {
      newPosition = (prevPosition + nextPosition) / 2;
    } else {
      newPosition = 1000.0;
    }

    // Secure reordering: Only allow card adjustments owned by this user
    const updateQuery = `
      UPDATE tasks 
      SET list_id = $1, position_index = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING id, list_id, position_index;
    `;

    const result = await pool.query(updateQuery, [
      listId,
      newPosition,
      id,
      userId,
    ]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Task not found or access denied." });
    }

    return res.status(200).json({
      message: "Task reordered successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Error handling task reorder:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.getBoardData = async (req, res) => {
  const userId = req.user.id;
  const requestedBoardId = req.query.boardId;

  try {
    const useBoardUserId = await hasColumn("boards", "user_id");
    const useListUserId = await hasColumn("lists", "user_id");
    const useTaskUserId = await hasColumn("tasks", "user_id");

    let board = null;

    if (requestedBoardId) {
      const boardResult = useBoardUserId
        ? await pool.query(
            "SELECT id, title FROM boards WHERE id = $1 AND user_id = $2",
            [requestedBoardId, userId],
          )
        : await pool.query(
            `SELECT b.id, b.title
             FROM boards b
             WHERE b.id = $1 AND EXISTS (
               SELECT 1 FROM lists l WHERE l.board_id = b.id AND l.user_id = $2
             )`,
            [requestedBoardId, userId],
          );

      if (boardResult.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Board not found or access denied." });
      }

      board = boardResult.rows[0];
    } else {
      board = await getActiveBoardForUser(userId);
      if (!board) {
        board = await createBoardWithDefaultLists(userId);
      }
    }

    const listFilter = useListUserId
      ? "board_id = $1 AND user_id = $2"
      : "board_id = $1";

    let listsResult = useListUserId
      ? await pool.query(
          "SELECT id, title, position_index FROM lists WHERE board_id = $1 AND user_id = $2 ORDER BY position_index ASC",
          [board.id, userId],
        )
      : await pool.query(
          "SELECT id, title, position_index FROM lists WHERE board_id = $1 ORDER BY position_index ASC",
          [board.id],
        );

    if (listsResult.rowCount === 0) {
      console.log(` Seeding pristine column templates for board: ${board.id}`);

      const insertSql = useListUserId
        ? `
          INSERT INTO lists (title, position_index, user_id, board_id) VALUES 
            ('To Do', 1000.0, $1, $2),
            ('In Progress', 2000.0, $1, $2),
            ('Done', 3000.0, $1, $2);
        `
        : `
          INSERT INTO lists (title, position_index, board_id) VALUES 
            ('To Do', 1000.0, $1),
            ('In Progress', 2000.0, $1),
            ('Done', 3000.0, $1);
        `;

      const insertParams = useListUserId ? [userId, board.id] : [board.id];
      await pool.query(insertSql, insertParams);

      listsResult = useListUserId
        ? await pool.query(
            "SELECT id, title, position_index FROM lists WHERE board_id = $1 AND user_id = $2 ORDER BY position_index ASC",
            [board.id, userId],
          )
        : await pool.query(
            "SELECT id, title, position_index FROM lists WHERE board_id = $1 ORDER BY position_index ASC",
            [board.id],
          );
    }

    const tasksResult = useTaskUserId
      ? await pool.query(
          `SELECT t.id, t.list_id, t.title, t.description, t.position_index
           FROM tasks t
           INNER JOIN lists l ON t.list_id = l.id
           WHERE l.board_id = $1 AND t.user_id = $2
           ORDER BY t.position_index ASC`,
          [board.id, userId],
        )
      : await pool.query(
          `SELECT t.id, t.list_id, t.title, t.description, t.position_index
           FROM tasks t
           INNER JOIN lists l ON t.list_id = l.id
           WHERE l.board_id = $1
           ORDER BY t.position_index ASC`,
          [board.id],
        );

    const tasksObj = {};
    const columnsObj = {};
    const columnOrder = [];

    listsResult.rows.forEach((list) => {
      const colId = `column-${list.id}`;
      columnOrder.push(colId);
      columnsObj[colId] = {
        id: colId,
        dbId: list.id,
        title: list.title,
        taskIds: [],
      };
    });

    tasksResult.rows.forEach((task) => {
      const taskId = `task-${task.id}`;
      const colId = `column-${task.list_id}`;

      tasksObj[taskId] = {
        id: taskId,
        dbId: task.id,
        title: task.title,
        description: task.description,
        position_index: parseFloat(task.position_index),
      };

      if (columnsObj[colId]) {
        columnsObj[colId].taskIds.push(taskId);
      }
    });

    return res.status(200).json({
      tasks: tasksObj,
      columns: columnsObj,
      columnOrder: columnOrder,
    });
  } catch (error) {
    console.error("Error fetching board schema layouts:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.createTask = async (req, res) => {
  const { listId, title, description, positionIndex } = req.body;
  const userId = req.user.id;

  if (!listId || !title || positionIndex === undefined) {
    return res
      .status(400)
      .json({ error: "listId, title, and positionIndex are required." });
  }

  try {
    const query = `
      INSERT INTO tasks (list_id, title, description, position_index, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, list_id, title, description, position_index, user_id;
    `;
    const result = await pool.query(query, [
      listId,
      title,
      description || null,
      positionIndex,
      userId,
    ]);

    return res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    console.error("Error creating new task in Supabase:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const query =
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id;";
    const result = await pool.query(query, [id, userId]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Task not found or access denied." });
    }

    return res
      .status(200)
      .json({ message: "Task successfully deleted.", deletedId: id });
  } catch (error) {
    console.error("Error clearing task from Supabase:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.updateTaskDetails = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ error: "Title is required." });
  }

  try {
    const query = `
      UPDATE tasks 
      SET title = $1, description = $2 
      WHERE id = $3 AND user_id = $4
      RETURNING id, title, description, list_id, position_index;
    `;
    const result = await pool.query(query, [
      title,
      description || null,
      id,
      userId,
    ]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Task not found or access denied." });
    }

    return res.status(200).json({ task: result.rows[0] });
  } catch (error) {
    console.error("Error updating task details in Supabase:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};
