import React, { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const VoiceRecording = ({ onTaskCreated, onTaskDeleted, onTaskUpdated }) => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);
    const recognitionRef = useRef(null);

    const lowerText = transcript.toLowerCase().trim();

    useEffect(() => {
        if (!SpeechRecognition) {
            alert("Speech Recognition not supported");
            return;
        }

        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = "en-US";

        recog.onresult = (e) => {
            setTranscript(e.results[0][0].transcript.trim());
        };

        recog.onend = () => setListening(false);
        recognitionRef.current = recog;
    }, []);

    const toggleListening = () => {
        if (listening) {
            recognitionRef.current.stop();
        } else {
            setTranscript("");
            setDueDate("");
            recognitionRef.current.start();
            setListening(true);
        }
    };

    const processCommand = async () => {
        if (!transcript.trim()) return;
        setLoading(true);

        const auth = getAuth();
        const token = await auth.currentUser.getIdToken();
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

        try {
            // Determine action type
            const isEdit = lowerText.includes("edit") || lowerText.includes("change");
            const isDelete = lowerText.includes("delete") || lowerText.includes("remove");
            const isDone = lowerText.includes("mark") && lowerText.includes("done");

            if (isEdit) {
                await editTaskTitle(transcript, token, API_URL);
            } else if (isDelete) {
                await deleteTaskByName(transcript, token, API_URL);
            } else if (isDone) {
                await markTaskDone(transcript, token, API_URL);
            } else {
                // Create task with optional due date
                await createTask(transcript, dueDate, token, API_URL);
            }

        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
            setTranscript("");
            setDueDate("");
        }
    };

    const editTaskTitle = async (text, token, API_URL) => {
        const match = text.match(/(?:edit|change)\s+task\s+(.+?)\s+to\s+(.+)/i);
        if (!match) {
            alert("Say: 'Edit task [old name] to [new name]'");
            return;
        }

        const oldName = match[1].trim();
        const newName = match[2].trim();

        const listRes = await fetch(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await listRes.json();

        const task = data.tasks.find(t => t.title.toLowerCase().includes(oldName.toLowerCase()));
        if (!task) {
            alert("Task not found: " + oldName);
            return;
        }

        const res = await fetch(`${API_URL}/tasks/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ title: newName })
        });

        const result = await res.json();
        if (result.success && result.tasks) {
            onTaskCreated(result.tasks); // Update the entire task list
            alert(`Task renamed to: ${newName}`);
        } else {
            alert("Edit failed");
        }
    };

    const deleteTaskByName = async (text, token, API_URL) => {
        const name = text.replace(/delete task|remove task/gi, "").trim();

        const listRes = await fetch(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await listRes.json();

        const task = data.tasks.find(t => t.title.toLowerCase().includes(name.toLowerCase()));
        if (!task) {
            alert("Task not found: " + name);
            return;
        }

        const res = await fetch(`${API_URL}/tasks/${task.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await res.json();
        if (result.success && result.tasks) {
            onTaskCreated(result.tasks);
            alert(`✓ Task deleted: ${task.title}`);
        } else {
            alert(result.message || "Delete failed");
        }
    };

    const markTaskDone = async (text, token, API_URL) => {
        const name = text.replace(/mark|done|task/gi, "").trim();

        const listRes = await fetch(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await listRes.json();

        const task = data.tasks.find(t => t.title.toLowerCase().includes(name.toLowerCase()));
        if (!task) {
            alert("Task not found: " + name);
            return;
        }

        const res = await fetch(`${API_URL}/tasks/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: "done" })
        });

        const result = await res.json();
        if (result.success && result.tasks) {
            onTaskCreated(result.tasks);
            alert(`✓ Task marked as done: ${task.title}`);
        } else {
            alert(result.message || "Failed to mark as done");
        }
    };

    const createTask = async (text, dueDate, token, API_URL) => {
        const payload = { text };
        if (dueDate) {
            payload.dueDate = dueDate;
        }

        const res = await fetch(`${API_URL}/tasks/ai`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.success && result.tasks) {
            onTaskCreated(result.tasks);
            alert("✓ Task created successfully!");
        } else {
            alert(result.message || "Failed to create task");
        }
    };

    const isCreateCommand = !lowerText.includes("edit") &&
        !lowerText.includes("delete") &&
        !lowerText.includes("remove") &&
        !lowerText.includes("mark") &&
        transcript.trim() !== "";

    return (
        <div className="space-y-6">
            <button
                onClick={toggleListening}
                className={`w-full py-6 rounded-3xl text-2xl font-bold text-white shadow-2xl transition-all transform hover:scale-105 ${listening
                    ? "bg-red-600 animate-pulse"
                    : "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
                    }`}
            >
                {listening ? "🎤 Listening... Speak Now" : "🎙️ Hold to Speak"}
            </button>

            {transcript && !listening && (
                <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-gray-100">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-3 text-gray-700">
                                ✏️ Edit Your Command
                            </label>
                            <textarea
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition resize-none"
                                rows={3}
                                autoFocus
                                placeholder="Edit your command here..."
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                💡 You can edit the text before confirming
                            </p>
                        </div>

                        {/* Show due date picker ONLY for create commands */}
                        {isCreateCommand && (
                            <div>
                                <label className="block text-lg font-semibold mb-3 text-gray-700">
                                    📅 Due Date (Optional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                                    />
                                    {dueDate && (
                                        <button
                                            onClick={() => setDueDate("")}
                                            className="absolute right-4 top-5 text-red-600 hover:text-red-800 font-semibold"
                                        >
                                            ✕ Clear
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {dueDate
                                        ? `📌 Task due: ${new Date(dueDate).toLocaleDateString()}`
                                        : "⏰ No due date set"}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={processCommand}
                                disabled={loading || !transcript.trim()}
                                className="flex-1 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition"
                            >
                                {loading ? "⏳ Processing..." : "✓ Confirm"}
                            </button>

                            <button
                                onClick={() => {
                                    setTranscript("");
                                    setDueDate("");
                                }}
                                className="px-8 py-5 bg-gray-600 text-white text-xl font-bold rounded-2xl hover:bg-gray-700 transition"
                            >
                                ✕ Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Command Help */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">🗣️ Voice Commands:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>Create:</strong> "Buy groceries tomorrow"</li>
                    <li>• <strong>Edit:</strong> "Edit task buy milk to buy almond milk"</li>
                    <li>• <strong>Delete:</strong> "Delete task buy milk"</li>
                    <li>• <strong>Complete:</strong> "Mark buy milk done"</li>
                </ul>
            </div>
        </div>
    );
};

export default VoiceRecording;