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

exports.getAllDashboards = async (req, res) => {
  const userId = req.user.id;

  try {
    const useActive = await hasColumn("boards", "is_active");
    const useUserId = await hasColumn("boards", "user_id");
    const selectFields = useActive
      ? "id, title, is_active, created_at"
      : "id, title, created_at";
    const selectFieldsWithAlias = useActive
      ? "DISTINCT b.id AS id, b.title AS title, b.is_active AS is_active, b.created_at AS created_at"
      : "DISTINCT b.id AS id, b.title AS title, b.created_at AS created_at";

    let result;
    if (useUserId) {
      result = await pool.query(
        `SELECT ${selectFields} FROM boards WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
    } else {
      result = await pool.query(
        `SELECT ${selectFieldsWithAlias}
         FROM boards b
         JOIN lists l ON l.board_id = b.id
         WHERE l.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId],
      );
    }

    return res.status(200).json({
      dashboards: result.rows,
    });
  } catch (error) {
    console.error("Error fetching boards:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.createDashboard = async (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Board title is required." });
  }

  try {
    const useActive = await hasColumn("boards", "is_active");
    const useUserId = await hasColumn("boards", "user_id");
    const checkQuery = useUserId
      ? `SELECT id FROM boards WHERE user_id = $1 AND title = $2`
      : `SELECT b.id FROM boards b JOIN lists l ON l.board_id = b.id WHERE l.user_id = $1 AND b.title = $2`;
    const checkParams = useUserId
      ? [userId, title.trim()]
      : [userId, title.trim()];
    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "A board with this name already exists." });
    }

    const insertQuery = useActive
      ? useUserId
        ? `INSERT INTO boards (title, user_id, is_active) VALUES ($1, $2, TRUE) RETURNING id, title, is_active, created_at;`
        : `INSERT INTO boards (title, is_active) VALUES ($1, TRUE) RETURNING id, title, is_active, created_at;`
      : useUserId
        ? `INSERT INTO boards (title, user_id) VALUES ($1, $2) RETURNING id, title, created_at;`
        : `INSERT INTO boards (title) VALUES ($1) RETURNING id, title, created_at;`;
    const result = useUserId
      ? await pool.query(insertQuery, [title.trim(), userId])
      : await pool.query(insertQuery, [title.trim()]);

    const boardId = result.rows[0].id;
    const defaultColumns = [
      { title: "To Do", position: 1000.0 },
      { title: "In Progress", position: 2000.0 },
      { title: "Done", position: 3000.0 },
    ];

    for (const col of defaultColumns) {
      await pool.query(
        `INSERT INTO lists (title, position_index, user_id, board_id) VALUES ($1, $2, $3, $4)`,
        [col.title, col.position, userId, boardId],
      );
    }

    return res
      .status(201)
      .json({
        message: "Board created successfully",
        dashboard: result.rows[0],
      });
  } catch (error) {
    console.error("Error creating board:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.updateDashboard = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const userId = req.user.id;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Board title is required." });
  }

  try {
    const useActive = await hasColumn("boards", "is_active");
    const returningFields = useActive
      ? "id, title, is_active, created_at"
      : "id, title, created_at";
    const updateQuery = `
      UPDATE boards
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING ${returningFields};
    `;
    const result = await pool.query(updateQuery, [title.trim(), id, userId]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Board not found or access denied." });
    }

    return res.status(200).json({
      message: "Board updated successfully",
      dashboard: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating board:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.setActiveDashboard = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const useActive = await hasColumn("boards", "is_active");
    const useUserId = await hasColumn("boards", "user_id");
    if (useActive) {
      if (useUserId) {
        await pool.query(
          `UPDATE boards SET is_active = FALSE WHERE user_id = $1`,
          [userId],
        );
      } else {
        await pool.query(
          `UPDATE boards SET is_active = FALSE WHERE id IN (SELECT board_id FROM lists WHERE user_id = $1)`,
          [userId],
        );
      }

      const result = useUserId
        ? await pool.query(
            `UPDATE boards SET is_active = TRUE WHERE id = $1 AND user_id = $2 RETURNING id, title, is_active;`,
            [id, userId],
          )
        : await pool.query(
            `UPDATE boards SET is_active = TRUE WHERE id = $1 AND id IN (SELECT board_id FROM lists WHERE user_id = $2) RETURNING id, title, is_active;`,
            [id, userId],
          );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Board not found or access denied." });
      }

      return res.status(200).json({
        message: "Board activated successfully",
        dashboard: result.rows[0],
      });
    }

    const result = useUserId
      ? await pool.query(
          `SELECT id, title FROM boards WHERE id = $1 AND user_id = $2`,
          [id, userId],
        )
      : await pool.query(
          `SELECT b.id, b.title FROM boards b WHERE b.id = $1 AND EXISTS (SELECT 1 FROM lists l WHERE l.board_id = b.id AND l.user_id = $2)`,
          [id, userId],
        );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Board not found or access denied." });
    }

    return res.status(200).json({
      message: "Board activated successfully",
      dashboard: result.rows[0],
    });
  } catch (error) {
    console.error("Error setting active board:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.deleteDashboard = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const useUserId = await hasColumn("boards", "user_id");
    const countResult = useUserId
      ? await pool.query(
          `SELECT COUNT(*) as count FROM boards WHERE user_id = $1`,
          [userId],
        )
      : await pool.query(
          `SELECT COUNT(DISTINCT b.id) as count FROM boards b JOIN lists l ON l.board_id = b.id WHERE l.user_id = $1`,
          [userId],
        );

    if (parseInt(countResult.rows[0].count, 10) <= 1) {
      return res
        .status(400)
        .json({
          error: "Cannot delete the only board. Create a new one first.",
        });
    }

    await pool.query(
      `DELETE FROM tasks WHERE list_id IN (SELECT id FROM lists WHERE board_id = $1 AND user_id = $2)`,
      [id, userId],
    );
    await pool.query(`DELETE FROM lists WHERE board_id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    const result = useUserId
      ? await pool.query(
          `DELETE FROM boards WHERE id = $1 AND user_id = $2 RETURNING id;`,
          [id, userId],
        )
      : await pool.query(
          `DELETE FROM boards WHERE id = $1 AND EXISTS (SELECT 1 FROM lists WHERE board_id = $1 AND user_id = $2) RETURNING id;`,
          [id, userId],
        );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Board not found or access denied." });
    }

    return res.status(200).json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};

exports.getBoardDataByDashboard = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;

  try {
    const useUserId = await hasColumn("boards", "user_id");
    const boardCheck = useUserId
      ? await pool.query(
          `SELECT id FROM boards WHERE id = $1 AND user_id = $2`,
          [boardId, userId],
        )
      : await pool.query(
          `SELECT b.id FROM boards b WHERE b.id = $1 AND EXISTS (SELECT 1 FROM lists l WHERE l.board_id = b.id AND l.user_id = $2)`,
          [boardId, userId],
        );

    if (boardCheck.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Board not found or access denied." });
    }

    const listsResult = await pool.query(
      `SELECT id, title, position_index FROM lists WHERE board_id = $1 AND user_id = $2 ORDER BY position_index ASC`,
      [boardId, userId],
    );

    const tasksResult = await pool.query(
      `SELECT t.id, t.list_id, t.title, t.description, t.position_index
       FROM tasks t
       INNER JOIN lists l ON t.list_id = l.id
       WHERE l.board_id = $1 AND t.user_id = $2
       ORDER BY t.position_index ASC`,
      [boardId, userId],
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
    console.error("Error fetching board data by board:", error);
    return res.status(500).json({ error: "Internal server database error." });
  }
};
