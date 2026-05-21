import React, { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Toaster } from "react-hot-toast";
import Column from "./components/Column";
import AuthPage from "./components/AuthPage";
import { handleLogOut } from "./services/authService";
import {
  fetchBoardLayout,
  fetchBoards,
  createBoard,
  onDragEnd as onDragEndHandler,
  handleAddTask,
  handleUpdateTaskDetails,
  handleDeleteTask,
} from "./services/boardService";

function App() {
  const [boardData, setBoardData] = useState({
    tasks: {},
    columns: {},
    columnOrder: [],
  });
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("supabase_session_token"),
  );

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme_mode");
    return saved ? saved === "dark" : true; // default to dark mode
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem("theme_mode", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const loadBoardsAndLayout = async (boardId) => {
    setLoading(true);

    try {
      const userBoards = await fetchBoards();
      let nextSelectedBoard =
        boardId || userBoards.find((board) => board.is_active)?.id;

      if (!userBoards.length) {
        const createdBoard = await createBoard("My Board");
        nextSelectedBoard = createdBoard.id;
        setBoards([createdBoard]);
      } else {
        setBoards(userBoards);
      }

      if (!nextSelectedBoard && userBoards.length > 0) {
        nextSelectedBoard = userBoards[0].id;
      }

      setSelectedBoardId(nextSelectedBoard);
      await fetchBoardLayout(setBoardData, setLoading, nextSelectedBoard);
    } catch (error) {
      console.error("Error loading boards:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBoardsAndLayout();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const onDragEnd = (result) =>
    onDragEndHandler(result, boardData, setBoardData);

  const handleBoardSelection = async (event) => {
    const boardId = event.target.value;
    setSelectedBoardId(boardId);
    await fetchBoardLayout(setBoardData, setLoading, boardId);
  };

  const handleAddBoard = async () => {
    const title = window.prompt(
      "Enter a name for your new board:",
      "New Board",
    );
    if (!title || title.trim() === "") return;

    try {
      const createdBoard = await createBoard(title.trim());
      const refreshedBoards = await fetchBoards();
      setBoards(refreshedBoards);
      setSelectedBoardId(createdBoard.id);
      await fetchBoardLayout(setBoardData, setLoading, createdBoard.id);
    } catch (error) {
      console.error("Failed to create board:", error);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-semibold ${
          isDarkMode
            ? "bg-slate-900 text-indigo-400"
            : "bg-white text-indigo-600"
        }`}
      >
        Loading board layout from Supabase...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div
      className={`min-h-screen p-8 ${
        isDarkMode ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Toaster position="bottom-right" />
      <header
        className={`mb-8 md:flex justify-between items-center px-4 py-4 rounded-lg ${
          isDarkMode ? "bg-slate-800" : "bg-white border border-gray-200"
        }`}
      >
        <div>
          <h1
            className={`text-3xl font-bold tracking-tight ${
              isDarkMode ? "text-indigo-400" : "text-indigo-600"
            }`}
          >
            LexiBoard Workspace
          </h1>
          <p
            className={`text-sm mt-1 ${
              isDarkMode ? "text-slate-400" : "text-gray-600"
            }`}
          >
            High-performance secure custom workspace environment
          </p>
        </div>
        <div className="header-actions flex items-center justify-end gap-4">
          <div
            className={`flex gap-4 items-center mobile-menu-container ${
              isMobileMenuOpen ? "open" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Board:</label>
              <select
                value={selectedBoardId || ""}
                onChange={handleBoardSelection}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddBoard}
                className="rounded-lg bg-indigo-500 px-3 py-2 text-sm text-white hover:bg-indigo-600"
              >
                New Board
              </button>
              {/* DARK MODE TOGGLE */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2.5 rounded-lg transition-all active:scale-95 ${
                  isDarkMode
                    ? "bg-slate-700 hover:bg-slate-600 text-yellow-400 border border-slate-600"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300"
                }`}
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l-2.122-2.122a.5.5 0 00-.707 0l-.353.353a.5.5 0 000 .707l2.122 2.122a.5.5 0 00.707 0l.353-.353a.5.5 0 000-.707zm2.828-10.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 9.9a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zm-9.9 2.828a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM9 11a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* LOG OUT PORTAL CONTROLLER ACCESS */}
            <button
              onClick={() => handleLogOut(setIsAuthenticated, setBoardData)}
              className={`px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-xs font-semibold ${
                isDarkMode
                  ? "bg-slate-950 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400"
                  : "bg-red-50 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700"
              }`}
            >
              Sign Out
            </button>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`mobile-menu-toggle p-2.5 rounded-lg transition-all active:scale-95 ${
              isDarkMode
                ? "bg-slate-700 hover:bg-slate-600 text-yellow-400 border border-slate-600"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300"
            }`}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 5h14a1 1 0 100-2H3a1 1 0 100 2zm14 4H3a1 1 0 100 2h14a1 1 0 100-2zm0 6H3a1 1 0 100 2h14a1 1 0 100-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Added 'isolate' to completely fix layout stacking errors across columns */}
        <div
          className={`flex flex-col md:flex-row gap-6 items-start overflow-x-auto  pb-4 md:pb-0 w-full isolate ${
            isDarkMode ? "bg-slate-900" : "bg-gray-50"
          }`}
        >
          {boardData.columnOrder.map((colId) => {
            const column = boardData.columns[colId];
            const tasks = column.taskIds.map(
              (taskId) => boardData.tasks[taskId],
            );
            return (
              <Column
                key={column.id}
                column={column}
                tasks={tasks}
                isDarkMode={isDarkMode}
                onAddTask={(colId, title, desc) =>
                  handleAddTask(colId, title, desc, boardData, setBoardData)
                }
                onDeleteTask={(taskId, colId) =>
                  handleDeleteTask(taskId, colId, boardData, setBoardData)
                }
                onUpdateTask={(taskId, title, desc) =>
                  handleUpdateTaskDetails(
                    taskId,
                    title,
                    desc,
                    boardData,
                    setBoardData,
                  )
                }
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

export default App;
