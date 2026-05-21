import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import TaskEditing from "./TaskEditing/TaskEditing";

export default function TaskCard({
  task,
  index,
  columnId,
  isDarkMode,
  onDelete,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  if (isEditing) {
    return (
      <TaskEditing
        task={task}
        isDarkMode={isDarkMode}
        onUpdate={onUpdate}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style, // ⚡ CRITICAL FIX: Keeps the element attached to the pointer cleanly
          }}
          onClick={() => setIsEditing(true)}
          className={`group relative border rounded-xl p-4 mb-3 shadow-md select-none transition-shadow duration-150 ${
            snapshot.isDragging
              ? isDarkMode
                ? "border-indigo-500 shadow-2xl shadow-indigo-500/10 bg-slate-900"
                : "border-indigo-400 shadow-2xl shadow-indigo-400/10 bg-blue-50"
              : isDarkMode
                ? "bg-slate-950 border-slate-850 hover:border-slate-800"
                : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start justify-between pr-6">
            <div>
              <h4
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  snapshot.isDragging
                    ? "text-indigo-300"
                    : isDarkMode
                      ? "text-slate-200"
                      : "text-gray-900"
                }`}
              >
                {task.title}
              </h4>
              {task.description && (
                <p
                  className={`text-xs mt-1 line-clamp-2 ${
                    isDarkMode ? "text-slate-500" : "text-gray-500"
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation(); // Avoid triggering edit panel
              onDelete(task.id, columnId);
            }}
            className={`absolute top-3.5 right-3 transition-all duration-150 p-1 rounded-md cursor-pointer ${
              snapshot.isDragging
                ? "opacity-0"
                : "opacity-0 group-hover:opacity-100"
            } ${
              isDarkMode
                ? "text-slate-600 hover:text-rose-400 hover:bg-rose-950/20"
                : "text-gray-400 hover:text-red-600 hover:bg-red-50"
            }`}
            title="Delete task"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
    </Draggable>
  );
}
