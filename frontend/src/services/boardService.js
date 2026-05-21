import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchBoardLayout = async (setBoardData, setLoading, boardId) => {
  setLoading(true);

  try {
    const url = boardId
      ? `${API_BASE_URL}/tasks/board?boardId=${boardId}`
      : `${API_BASE_URL}/tasks/board`;
    const response = await axios.get(url);
    setBoardData(response.data);
    setLoading(false);
  } catch (error) {
    console.error("Failed to load board columns:", error);
    toast.error("Could not fetch workspace data from database.");
    setLoading(false);
  }
};

export const fetchBoards = async () => {
  const response = await axios.get(`${API_BASE_URL}/boards`);
  return response.data.dashboards;
};

export const createBoard = async (title, description = "") => {
  const response = await axios.post(`${API_BASE_URL}/boards`, {
    title,
    description,
  });
  return response.data.dashboard;
};

export const activateBoard = async (boardId) => {
  const response = await axios.patch(
    `${API_BASE_URL}/boards/${boardId}/activate`,
  );
  return response.data.dashboard;
};

export const onDragEnd = async (result, boardData, setBoardData) => {
  const { destination, source, draggableId } = result;

  if (!destination) return;
  if (
    destination.droppableId === source.droppableId &&
    destination.index === source.index
  )
    return;

  const sourceCol = boardData.columns[source.droppableId];
  const destCol = boardData.columns[destination.droppableId];
  const previousState = JSON.parse(JSON.stringify(boardData));

  const newSourceTaskIds = Array.from(sourceCol.taskIds);
  newSourceTaskIds.splice(source.index, 1);

  let newColumns = { ...boardData.columns };

  if (sourceCol.id === destCol.id) {
    newSourceTaskIds.splice(destination.index, 0, draggableId);
    newColumns[sourceCol.id] = { ...sourceCol, taskIds: newSourceTaskIds };
  } else {
    const newDestTaskIds = Array.from(destCol.taskIds);
    newDestTaskIds.splice(destination.index, 0, draggableId);

    newColumns[sourceCol.id] = { ...sourceCol, taskIds: newSourceTaskIds };
    newColumns[destCol.id] = { ...destCol, taskIds: newDestTaskIds };
  }

  setBoardData((prev) => ({ ...prev, columns: newColumns }));

  const finalTaskOrder = newColumns[destCol.id].taskIds;
  let prevPosition = null;
  let nextPosition = null;
  const targetIndex = destination.index;

  if (targetIndex > 0) {
    const prevTaskId = finalTaskOrder[targetIndex - 1];
    prevPosition = boardData.tasks[prevTaskId].position_index;
  }
  if (targetIndex < finalTaskOrder.length - 1) {
    const nextTaskId = finalTaskOrder[targetIndex + 1];
    nextPosition = boardData.tasks[nextTaskId].position_index;
  }

  const rawTaskId = draggableId.split("-")[1];

  try {
    const response = await axios.patch(
      `${API_BASE_URL}/tasks/${rawTaskId}/reorder`,
      {
        listId: destCol.dbId,
        prevPosition,
        nextPosition,
      },
    );

    const updatedTaskData = response.data.task;
    setBoardData((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [draggableId]: {
          ...prev.tasks[draggableId],
          position_index: parseFloat(updatedTaskData.position_index),
        },
      },
    }));
    toast.success("Task order updated!");
  } catch (error) {
    console.error("Network synchronization failed:", error);
    setBoardData(previousState);
    toast.error("Failed to sync card. Reverting placement...");
  }
};

export const handleAddTask = async (
  columnId,
  title,
  description,
  boardData,
  setBoardData,
) => {
  const column = boardData.columns[columnId];
  const dbListId = column.dbId;
  let newPositionIndex = 1000.0;

  if (column.taskIds.length > 0) {
    const lastTaskId = column.taskIds[column.taskIds.length - 1];
    const lastTaskPosition = boardData.tasks[lastTaskId].position_index;
    newPositionIndex = lastTaskPosition + 1000.0;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/tasks`, {
      listId: dbListId,
      title: title,
      description: description,
      positionIndex: newPositionIndex,
    });

    const savedTask = response.data.task;
    const frontendTaskId = `task-${savedTask.id}`;

    const formattedTask = {
      id: frontendTaskId,
      dbId: savedTask.id,
      title: savedTask.title,
      description: savedTask.description,
      position_index: parseFloat(savedTask.position_index),
    };

    setBoardData((prev) => ({
      ...prev,
      tasks: { ...prev.tasks, [frontendTaskId]: formattedTask },
      columns: {
        ...prev.columns,
        [columnId]: {
          ...column,
          taskIds: [...column.taskIds, frontendTaskId],
        },
      },
    }));

    toast.success("Card created successfully!");
  } catch (error) {
    console.error("Failed to append card row:", error);
    toast.error("Could not write task to database.");
  }
};

export const handleUpdateTaskDetails = async (
  taskId,
  updatedTitle,
  updatedDescription,
  boardData,
  setBoardData,
) => {
  const previousState = JSON.parse(JSON.stringify(boardData));

  // Optimistic UI state adjustment
  setBoardData((prev) => ({
    ...prev,
    tasks: {
      ...prev.tasks,
      [taskId]: {
        ...prev.tasks[taskId],
        title: updatedTitle,
        description: updatedDescription,
      },
    },
  }));

  const rawId = taskId.split("-")[1];
  try {
    await axios.put(`${API_BASE_URL}/tasks/${rawId}`, {
      title: updatedTitle,
      description: updatedDescription,
    });
    toast.success("Changes saved.");
  } catch (error) {
    console.error("Failed to sync edited fields:", error);
    setBoardData(previousState);
    toast.error("Could not save updates. Reverting details...");
  }
};

export const handleDeleteTask = async (
  taskId,
  columnId,
  boardData,
  setBoardData,
) => {
  const previousState = JSON.parse(JSON.stringify(boardData));

  setBoardData((prev) => {
    const updatedColumns = { ...prev.columns };
    updatedColumns[columnId].taskIds = updatedColumns[columnId].taskIds.filter(
      (id) => id !== taskId,
    );
    const updatedTasks = { ...prev.tasks };
    delete updatedTasks[taskId];

    return { ...prev, tasks: updatedTasks, columns: updatedColumns };
  });

  const rawId = taskId.split("-")[1];
  try {
    await axios.delete(`${API_BASE_URL}/tasks/${rawId}`);
    toast.success("Card deleted.");
  } catch (error) {
    console.error("Failed to delete card row from database:", error);
    setBoardData(previousState);
    toast.error("Could not sync deletion. Card restored.");
  }
};
