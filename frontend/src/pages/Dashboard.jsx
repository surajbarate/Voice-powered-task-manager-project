import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import VoiceRecording from "../components/VoiceRecording.jsx";
import TaskList from "../components/TaskList.jsx";
import { fetchWithAuth } from "../api";
import { requestFCMToken } from "../utils/notification.js";
import { getAuth } from "firebase/auth";
import { onMessage } from "firebase/messaging";
import { messaging } from "../firebase";

const Dashboard = () => {
    const { currentUser, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔔 NOTIFICATION LISTENER - Listen for foreground notifications
    useEffect(() => {
        console.log("🔔 Setting up notification listener...");

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log("🎉 Notification received!", payload);

            const { title, body } = payload.notification || {};

            if (!title || !body) {
                console.error("❌ Notification missing title or body");
                return;
            }

            console.log("📢 Displaying notification:", title, body);

            // Check notification permission
            if (Notification.permission === 'granted') {
                // Show browser notification
                const notification = new Notification(title, {
                    body: body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'task-notification',
                    requireInteraction: false,
                    silent: false
                });

                // Auto-close after 5 seconds
                setTimeout(() => notification.close(), 5000);

                // Optional: Handle click
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } else if (Notification.permission === 'default') {
                // Permission not determined yet
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, { body });
                    }
                });
            } else {
                // Fallback if permission denied
                console.warn("⚠️ Notification permission denied, using alert");
                alert(`${title}\n\n${body}`);
            }
        });

        return () => {
            console.log("🔕 Cleaning up notification listener");
            unsubscribe();
        };
    }, []);

    // 💾 SAVE FCM TOKEN
    useEffect(() => {
        async function saveToken() {
            console.log("💾 Saving FCM token...");

            const fcmToken = await requestFCMToken();
            if (!fcmToken) {
                console.error("❌ Failed to get FCM token");
                return;
            }

            console.log("✅ FCM token received:", fcmToken.substring(0, 30) + "...");

            const user = getAuth().currentUser;
            if (!user) {
                console.error("❌ User not logged in");
                return;
            }

            try {
                const idToken = await user.getIdToken(true);

                const response = await fetch("http://localhost:5000/save-fcm-token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${idToken}`
                    },
                    body: JSON.stringify({ fcmToken })
                });

                const data = await response.json();
                console.log("💾 Token save response:", data);

                if (data.message) {
                    console.log("✅ Token saved successfully!");
                }
            } catch (error) {
                console.error("❌ Error saving token:", error);
            }
        }

        saveToken();
    }, []);

    // 📋 LOAD TASKS
    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await fetchWithAuth("/tasks");
            if (data.success) {
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error("Failed to load tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleLogout = async () => {
        await logout();
        window.location.href = "/";
    };

    const handleTasksUpdate = (updatedTasks) => {
        setTasks(updatedTasks);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-lg">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Welcome back, <span className="font-semibold">{currentUser ? currentUser.fullName : "Guest"}</span> 👋
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="mt-4 md:mt-0 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition transform hover:scale-105 shadow-md"
                >
                    🚪 Logout
                </button>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task List */}
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">📋 Your Tasks</h2>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : (
                        <TaskList
                            tasks={tasks}
                            onTasksUpdate={handleTasksUpdate}
                            refreshTasks={loadTasks}
                        />
                    )}
                </div>

                {/* Voice Input */}
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">🎙️ Voice Commands</h2>
                    <VoiceRecording
                        onTaskCreated={handleTasksUpdate}
                        onTaskDeleted={handleTasksUpdate}
                        onTaskUpdated={handleTasksUpdate}
                    />
                </div>
            </main>

            {/* Stats Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                    <div className="text-4xl mb-2">📝</div>
                    <div className="text-3xl font-bold text-gray-800">{tasks.filter(t => t.status === 'pending').length}</div>
                    <div className="text-gray-600 mt-1">Pending Tasks</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <div className="text-3xl font-bold text-green-600">{tasks.filter(t => t.status === 'done').length}</div>
                    <div className="text-gray-600 mt-1">Completed Tasks</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-3xl font-bold text-purple-600">{tasks.length}</div>
                    <div className="text-gray-600 mt-1">Total Tasks</div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;