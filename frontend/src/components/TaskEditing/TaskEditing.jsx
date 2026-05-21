import React, { useState } from "react";
function TaskEditing({ onUpdate, task, isDarkMode, onClose }) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || "",
  );
  const handleSave = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    onUpdate(task.id, editTitle.trim(), editDescription.trim());
    onClose();
  };
  return (
    <div
      className={`border rounded-xl p-3.5 mb-2.5 shadow-xl transition-all duration-150 ${
        isDarkMode
          ? "bg-slate-900 border-indigo-500/50"
          : "bg-white border-indigo-300"
      }`}
    >
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <label
          className={`text-[10px] font-bold uppercase tracking-wider ${
            isDarkMode ? "text-indigo-400" : "text-indigo-600"
          }`}
        >
          Edit Title
        </label>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className={`w-full rounded-lg p-2 text-xs focus:outline-none border focus:border-indigo-500 ${
            isDarkMode
              ? "bg-slate-950 border-slate-800 text-white"
              : "bg-gray-50 border-gray-300 text-gray-900"
          }`}
          required
        />

        <label
          className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
            isDarkMode ? "text-slate-400" : "text-gray-600"
          }`}
        >
          Edit Description
        </label>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className={`w-full rounded-lg p-2 text-xs resize-none h-16 focus:outline-none border focus:border-indigo-500 ${
            isDarkMode
              ? "bg-slate-950 border-slate-800 text-slate-300"
              : "bg-gray-50 border-gray-300 text-gray-700"
          }`}
        />

        <div className="flex gap-2 justify-end items-center mt-1">
          <button
            type="button"
            onClick={() => onClose()}
            className={`text-xs px-2.5 py-1.5 transition-colors ${
              isDarkMode
                ? "text-slate-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs text-white font-semibold rounded-md transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskEditing;
