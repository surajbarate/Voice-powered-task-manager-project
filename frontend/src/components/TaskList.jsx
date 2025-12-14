import React, { useState } from "react";
import { fetchWithAuth } from "../api";

const TaskList = ({ tasks, onTasksUpdate, refreshTasks }) => {
    const [editingTask, setEditingTask] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    // DELETE TASK
    const handleDelete = async (taskId) => {
        if (!window.confirm("🗑️ Are you sure you want to delete this task?")) return;

        setLoading(true);
        try {
            const data = await fetchWithAuth(`/tasks/${taskId}`, { method: "DELETE" });
            if (data.success && data.tasks) {
                onTasksUpdate(data.tasks);
            } else {
                alert(data.message || "Failed to delete task");
            }
        } catch (error) {
            alert("Error deleting task: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // START EDIT
    const startEdit = (task) => {
        setEditingTask(task.id);
        setEditTitle(task.title);
        setEditDescription(task.description || "");
        setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : "");
    };

    // CANCEL EDIT
    const cancelEdit = () => {
        setEditingTask(null);
        setEditTitle("");
        setEditDescription("");
        setEditDueDate("");
    };

    // SAVE EDIT
    const saveEdit = async (taskId) => {
        if (!editTitle.trim()) {
            alert("Task title cannot be empty!");
            return;
        }

        setLoading(true);
        try {
            const data = await fetchWithAuth(`/tasks/${taskId}`, {
                method: "PUT",
                body: JSON.stringify({
                    title: editTitle.trim(),
                    description: editDescription.trim(),
                    dueDate: editDueDate || null,
                }),
            });

            if (data.success && data.tasks) {
                onTasksUpdate(data.tasks);
                cancelEdit();
            } else {
                alert(data.message || "Failed to update task");
            }
        } catch (error) {
            alert("Error updating task: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // TOGGLE STATUS
    const toggleStatus = async (task) => {
        setLoading(true);
        try {
            const newStatus = task.status === "pending" ? "done" : "pending";

            const data = await fetchWithAuth(`/tasks/${task.id}`, {
                method: "PUT",
                body: JSON.stringify({ status: newStatus }),
            });

            if (data.success && data.tasks) {
                onTasksUpdate(data.tasks);
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (error) {
            alert("Error updating status: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // FORMAT DATE
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateOnly = date.toDateString();
        const todayOnly = today.toDateString();
        const tomorrowOnly = tomorrow.toDateString();

        if (dateOnly === todayOnly) return "📅 Today";
        if (dateOnly === tomorrowOnly) return "📅 Tomorrow";

        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `⚠️ Overdue (${Math.abs(diffDays)} days ago)`;
        }

        return `📅 ${date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        })}`;
    };

    // CHECK IF OVERDUE
    const isOverdue = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    if (!tasks || tasks.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg">No tasks yet.</p>
                <p className="text-gray-400 text-sm mt-2">Try adding one with your voice!</p>
            </div>
        );
    }

    // Separate pending and done tasks
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const doneTasks = tasks.filter(t => t.status === 'done');

    return (
        <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2">
                            {pendingTasks.length}
                        </span>
                        Pending
                    </h3>
                    <ul className="space-y-3">
                        {pendingTasks.map(task => (
                            <li
                                key={task.id}
                                className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${isOverdue(task.dueDate)
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                {editingTask === task.id ? (
                                    // EDIT MODE
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Title *
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                placeholder="Task title"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                placeholder="Add details..."
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Due Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                value={editDueDate}
                                                onChange={(e) => setEditDueDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => saveEdit(task.id)}
                                                disabled={loading || !editTitle.trim()}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
                                            >
                                                {loading ? "Saving..." : "✓ Save"}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                disabled={loading}
                                                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition"
                                            >
                                                ✕ Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // VIEW MODE
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg text-gray-800 flex-1">
                                                {task.title}
                                            </h4>
                                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold ml-2">
                                                Pending
                                            </span>
                                        </div>

                                        {task.description && (
                                            <p className="text-gray-600 text-sm mb-2 leading-relaxed">
                                                {task.description}
                                            </p>
                                        )}

                                        {task.dueDate && (
                                            <p className={`text-sm font-semibold mb-3 ${isOverdue(task.dueDate) ? 'text-red-600' : 'text-blue-600'
                                                }`}>
                                                {formatDate(task.dueDate)}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <button
                                                onClick={() => toggleStatus(task)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition disabled:opacity-50"
                                            >
                                                ✓ Mark Done
                                            </button>
                                            <button
                                                onClick={() => startEdit(task)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition disabled:opacity-50"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold transition disabled:opacity-50"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Completed Tasks */}
            {doneTasks.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2">
                            {doneTasks.length}
                        </span>
                        Completed
                    </h3>
                    <ul className="space-y-3">
                        {doneTasks.map(task => (
                            <li
                                key={task.id}
                                className="border-2 border-green-200 bg-green-50 rounded-xl p-4 transition-all hover:shadow-md opacity-75"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-600 line-through flex-1">
                                        {task.title}
                                    </h4>
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold ml-2">
                                        Done ✓
                                    </span>
                                </div>

                                {task.description && (
                                    <p className="text-gray-500 text-sm mb-2 line-through">
                                        {task.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button
                                        onClick={() => toggleStatus(task)}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-semibold transition disabled:opacity-50"
                                    >
                                        ↺ Mark Pending
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold transition disabled:opacity-50"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TaskList;