import React, { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";

export default function Column({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  isDarkMode,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onAddTask(column.id, taskTitle.trim(), taskDescription.trim());
    setTaskTitle("");
    setTaskDescription("");
    setIsEditing(false);
  };

  const getColumnBackground = () => {
    const title = column.title.toLowerCase();
    if (title.includes("done") || title.includes("complete")) {
      return isDarkMode
        ? "bg-emerald-600/10 border-emerald-900/30"
        : "bg-emerald-50 border-emerald-200";
    } else if (title.includes("progress") || title.includes("doing")) {
      return isDarkMode
        ? "bg-amber-950/10 border-amber-900/30"
        : "bg-amber-50 border-amber-200";
    } else {
      return isDarkMode
        ? "bg-blue-950/10 border-blue-900/30"
        : "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      className={`w-full md:w-80 flex-shrink-0 border rounded-2xl p-4 flex flex-col max-h-[80vh] ${getColumnBackground()}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 select-none px-1">
        <div className="flex items-center gap-2.5">
          <h3
            className={`font-bold text-sm tracking-wide ${
              isDarkMode ? "text-slate-200" : "text-gray-700"
            }`}
          >
            {column.title}
          </h3>
          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded-full shadow-inner ${
              isDarkMode
                ? "bg-slate-950 border border-slate-800 text-slate-400"
                : "bg-gray-200 border border-gray-300 text-gray-600"
            }`}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      {/* ⚡ DROPPABLE ELEMENT CONTAINER AREA ⚡ */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto overflow-x-hidden min-h-[150px] rounded-xl transition-colors duration-150 p-1 ${
              snapshot.isDraggingOver
                ? isDarkMode
                  ? "bg-slate-900/40"
                  : "bg-blue-100/50"
                : "bg-transparent"
            }`}
          >
            {tasks.map((task, index) => {
              // Fail-safe protection array mapping
              if (!task) return null;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  columnId={column.id}
                  isDarkMode={isDarkMode}
                  onDelete={onDeleteTask}
                  onUpdate={onUpdateTask}
                />
              );
            })}
            {provided.placeholder}{" "}
            {/* ⚡ Keeps column shapes steady while tracking cards */}
          </div>
        )}
      </Droppable>

      {/* Footer Addition Control Segment */}
      <div className="mt-2 mt-auto">
        {isEditing ? (
          <form
            onSubmit={handleSubmit}
            className={`rounded-xl p-3 flex flex-col gap-2 mt-2 shadow-xl animate-fadeIn border ${
              isDarkMode
                ? "bg-slate-950 border-slate-800"
                : "bg-white border-gray-200"
            }`}
          >
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="What needs to be done?..."
              className={`w-full rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 font-medium border ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              }`}
              autoFocus
              required
            />
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Add details/description... (optional)"
              className={`w-full rounded-lg p-2 text-xs resize-none h-16 focus:outline-none focus:border-indigo-500 border ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 text-slate-400"
                  : "bg-gray-50 border-gray-300 text-gray-600"
              }`}
            />
            <div className="flex gap-2 items-center justify-end text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setTaskTitle("");
                  setTaskDescription("");
                }}
                className={`px-3 py-1.5 rounded transition-colors ${
                  isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-white font-medium rounded-md transition-colors"
              >
                Add Card
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className={`w-full flex items-center justify-center gap-1.5 p-2 text-sm rounded-lg transition-all mt-2 border border-dashed ${
              isDarkMode
                ? "text-slate-400 hover:text-indigo-400 border-slate-800 hover:border-indigo-500/30 bg-slate-900/10 hover:bg-indigo-950/20"
                : "text-gray-600 hover:text-indigo-600 border-gray-300 hover:border-indigo-300 bg-gray-50 hover:bg-indigo-50"
            }`}
          >
            <span className="text-base font-light">+</span> Add Task Card
          </button>
        )}
      </div>
    </div>
  );
}
