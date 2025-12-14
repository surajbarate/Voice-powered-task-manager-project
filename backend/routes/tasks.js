// routes/tasks.js
console.log("task routes loaded");

import express from "express";
import admin from "firebase-admin";
import { db } from "../firebaseAdmin.js";
import authenticateUser from "../authenticateUser.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendNotification } from "../utils/sendNotification.js";


const router = express.Router();

/* -------------------------
   Helper: Find task by partial name match
---------------------------*/
const findTaskByName = (tasks, searchName) => {
    const search = searchName.toLowerCase().trim();

    // Try exact match first
    let task = tasks.find(t => t.data().title.toLowerCase().trim() === search);
    if (task) return task;

    // Try contains match
    task = tasks.find(t => t.data().title.toLowerCase().includes(search));
    if (task) return task;

    // Try word-by-word match
    const searchWords = search.split(' ');
    task = tasks.find(t => {
        const titleLower = t.data().title.toLowerCase();
        return searchWords.every(word => titleLower.includes(word));
    });
    if (task) return task;

    // Try fuzzy match - at least 50% of words match
    task = tasks.find(t => {
        const titleLower = t.data().title.toLowerCase();
        const titleWords = titleLower.split(' ');
        const matchCount = searchWords.filter(word =>
            titleWords.some(tWord => tWord.includes(word) || word.includes(tWord))
        ).length;
        return matchCount >= Math.ceil(searchWords.length / 2);
    });

    return task || null;
};

/* -------------------------
   Helper: createTaskInFirebase
---------------------------*/
const createTaskInFirebase = async (userId, aiTask) => {
    const { title, dueDate, description } = aiTask || {};

    let formattedDueDate = null;
    if (dueDate) {
        const due = new Date(dueDate);
        if (!isNaN(due.getTime())) {
            formattedDueDate = admin.firestore.Timestamp.fromDate(due);
        }
    }

    const docRef = await db.collection("tasks").add({
        title: title || "Untitled Task",
        description: description || "",
        status: "pending",
        dueDate: formattedDueDate,
        createdAt: admin.firestore.Timestamp.now(),
        userId,
    });

    return docRef.id;
};

/* -------------------------
   Helper: fetchTasksForUser
---------------------------*/
const fetchTasksForUser = async (userId) => {
    const snapshot = await db
        .collection("tasks")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
    console.log("Tasks found for user:", snapshot.docs.length);

    return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
            id: doc.id,
            title: d.title,
            description: d.description || "",
            status: d.status || "pending",
            userId: d.userId,
            createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
            dueDate: d.dueDate ? d.dueDate.toDate().toISOString() : null,
        };
    });
};

/* =======================================
   POST /tasks/ai  ← AI-powered voice/text
   ======================================= */
router.post("/ai", authenticateUser, async (req, res) => {
    console.log("\n=== AI TASK REQUEST ===");
    console.log("Request body:", req.body);

    try {
        const { text, dueDate } = req.body;
        const userId = req.user.uid;

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "No text provided" });
        }

        // Check API key
        console.log("Checking API key...");
        console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
        console.log("API Key length:", process.env.GEMINI_API_KEY?.length || 0);
        console.log("API Key preview:", process.env.GEMINI_API_KEY?.substring(0, 15) + "..." || "NOT FOUND");

        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ GEMINI_API_KEY not found in environment!");
            return res.status(500).json({
                success: false,
                message: "Server configuration error: GEMINI_API_KEY not set"
            });
        }

        if (!process.env.GEMINI_API_KEY.startsWith("AIza")) {
            console.error("❌ Invalid API key format!");
            return res.status(500).json({
                success: false,
                message: "Invalid API key format in server configuration"
            });
        }

        // Initialize Gemini
        console.log("Initializing Gemini AI...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Extract user intent and respond ONLY in JSON format exactly like one of these examples (no extra text):

Create:
{ "action": "create", "task": { "title": "Buy milk", "description": "2 liters" } }

Delete:
{ "action": "delete", "task": { "title": "Buy milk" } }

Edit:
{ "action": "edit", "task": { "title": "Buy milk", "newTitle": "Buy almond milk" } }

Done:
{ "action": "done", "task": { "title": "Buy milk" } }

IMPORTANT: For delete, edit, and done actions, extract only the core task name.
Examples:
- "delete task buy milk" → { "action": "delete", "task": { "title": "buy milk" } }
- "edit task buy milk to buy almond milk" → { "action": "edit", "task": { "title": "buy milk", "newTitle": "buy almond milk" } }
- "mark buy milk done" → { "action": "done", "task": { "title": "buy milk" } }

User Input: "${text}"`;

        console.log("Calling Gemini API...");
        let aiOutput = "";

        try {
            const result = await model.generateContent(prompt);
            aiOutput = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            aiOutput = aiOutput.replace(/```json|```/g, "").trim();
            console.log("✅ AI Response:", aiOutput);
        } catch (gErr) {
            console.error("❌ Gemini API Error:", gErr.message);
            console.error("Full error:", gErr);

            if (gErr.message?.includes("API_KEY_INVALID") || gErr.message?.includes("API key not valid")) {
                return res.status(500).json({
                    success: false,
                    message: "Invalid API key. Please verify your Gemini API key at https://aistudio.google.com"
                });
            }

            if (gErr.message?.includes("quota")) {
                return res.status(500).json({
                    success: false,
                    message: "API quota exceeded. Please try again later."
                });
            }

            return res.status(500).json({
                success: false,
                message: "AI service error: " + gErr.message
            });
        }

        // Parse AI response
        let parsed;
        try {
            parsed = JSON.parse(aiOutput);
            console.log("Parsed action:", parsed.action, "Task:", parsed.task);
        } catch (err) {
            console.error("❌ Failed to parse AI output:", aiOutput);
            return res.status(500).json({
                success: false,
                message: "Failed to understand command. Please try again."
            });
        }

        const { action, task } = parsed || {};

        if (!action || !task) {
            return res.status(400).json({
                success: false,
                message: "Could not understand the command"
            });
        }

        let newTaskId = null;

        // Handle different actions
        if (action === "create") {
            if (dueDate) task.dueDate = dueDate;
            newTaskId = await createTaskInFirebase(userId, task);
            console.log("✅ Task created:", newTaskId);


            // ADD THIS LINE:
            console.log("📞 About to call sendNotification...");

            await sendNotification(userId, "New Task Created", `Your task "${task.title}" was added.`);

            // ADD THIS LINE:
            console.log("📞 sendNotification call completed");

        } else if (action === "delete") {
            const snapshot = await db.collection("tasks").where("userId", "==", userId).get();
            console.log("🔍 DELETE - User ID:", userId);
            console.log("🔍 DELETE - Tasks found:", snapshot.docs.length);
            console.log("🔍 DELETE - Task to find:", task.title);
            console.log("🔍 DELETE - All titles:", snapshot.docs.map(d => d.data().title));

            if (snapshot.empty) {
                return res.status(404).json({ success: false, message: "No tasks found" });
            }

            const matchingTask = findTaskByName(snapshot.docs, task.title);
            if (!matchingTask) {
                const availableTasks = snapshot.docs.map(doc => doc.data().title);
                return res.status(404).json({
                    success: false,
                    message: `Task not found: "${task.title}". Available: ${availableTasks.join(', ')}`
                });
            }

            await matchingTask.ref.delete();
            console.log("✅ Task deleted:", matchingTask.data().title);

            // Send notification
            await sendNotification(userId, "Task Deleted", `Your task "${matchingTask.data().title}" was deleted.`);

        } else if (action === "edit") {
            const snapshot = await db.collection("tasks").where("userId", "==", userId).get();
            if (snapshot.empty) {
                return res.status(404).json({ success: false, message: "No tasks found" });
            }

            const matchingTask = findTaskByName(snapshot.docs, task.title);
            if (!matchingTask) {
                const availableTasks = snapshot.docs.map(doc => doc.data().title);
                return res.status(404).json({
                    success: false,
                    message: `Task not found: "${task.title}". Available: ${availableTasks.join(', ')}`
                });
            }

            const updateFields = {};
            if (task.newTitle) updateFields.title = task.newTitle;
            if (task.newDescription) updateFields.description = task.newDescription;
            if (task.newDueDate && task.newDueDate !== "YYYY-MM-DDTHH:mm") {
                const parsedDate = new Date(task.newDueDate);
                if (!isNaN(parsedDate.getTime())) {
                    updateFields.dueDate = admin.firestore.Timestamp.fromDate(parsedDate);
                }
            }

            if (Object.keys(updateFields).length) {
                await matchingTask.ref.update(updateFields);
                console.log("✅ Task updated:", matchingTask.data().title);
            }

            // Send notification
            await sendNotification(
                userId,
                "Task Updated",
                `Your task "${task.newTitle || matchingTask.data().title}" was updated.`
            );



        } else if (action === "done") {
            const snapshot = await db.collection("tasks").where("userId", "==", userId).get();
            if (snapshot.empty) {
                return res.status(404).json({ success: false, message: "No tasks found" });
            }

            const matchingTask = findTaskByName(snapshot.docs, task.title);
            if (!matchingTask) {
                const availableTasks = snapshot.docs.map(doc => doc.data().title);
                return res.status(404).json({
                    success: false,
                    message: `Task not found: "${task.title}". Available: ${availableTasks.join(', ')}`
                });
            }

            await matchingTask.ref.update({ status: "done" });
            console.log("✅ Task marked done:", matchingTask.data().title);

            // Send notification
            await sendNotification(
                userId,
                "Task Completed",
                `Great job! You completed "${matchingTask.data().title}".`
            );

        }

        // Return updated task list
        const tasks = await fetchTasksForUser(userId);
        console.log("=== REQUEST COMPLETE ===\n");
        return res.json({ success: true, tasks, newTaskId });

    } catch (err) {
        console.error("❌ UNEXPECTED ERROR:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error"
        });
    }
});

/* =======================================
   POST /tasks  ← Manual create from UI
   ======================================= */
router.post("/", authenticateUser, async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;
        const userId = req.user.uid;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }

        let parsedDate = null;
        if (dueDate) {
            parsedDate = new Date(dueDate);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: "Invalid dueDate format" });
            }
        }

        const docRef = await db.collection("tasks").add({
            title: title.trim(),
            description: description || "",
            status: "pending",
            userId,
            dueDate: parsedDate ? admin.firestore.Timestamp.fromDate(parsedDate) : null,
            createdAt: admin.firestore.Timestamp.now(),
        });

        const tasks = await fetchTasksForUser(userId);
        return res.json({ success: true, tasks, newTaskId: docRef.id });
    } catch (err) {
        console.error("/tasks POST error:", err);
        return res.status(500).json({ success: false, message: "Failed to create task" });
    }
});

/* =======================================
   GET /tasks
   ======================================= */
router.get("/", authenticateUser, async (req, res) => {
    try {
        const tasks = await fetchTasksForUser(req.user.uid);
        return res.json({ success: true, tasks });
    } catch (err) {
        console.error("/tasks GET error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch tasks" });
    }
});

/* =======================================
   DELETE /tasks/:taskId
   ======================================= */
router.delete("/:taskId", authenticateUser, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.uid;
        const taskRef = db.collection("tasks").doc(taskId);
        const taskSnap = await taskRef.get();

        if (!taskSnap.exists) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        const task = taskSnap.data();
        if (task.userId !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await taskRef.delete();

        await sendNotification(
            userId,
            "Task Deleted",
            `Your task "${task.title}" was deleted.`
        );


        const tasks = await fetchTasksForUser(userId);
        return res.json({ success: true, message: "Deleted", tasks });
    } catch (err) {
        console.error("/tasks DELETE error:", err);
        return res.status(500).json({ success: false, message: "Failed to delete task" });
    }
});

/* =======================================
   PUT /tasks/:taskId
   ======================================= */
router.put("/:taskId", authenticateUser, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, status, dueDate } = req.body;
        const userId = req.user.uid;

        const taskRef = db.collection("tasks").doc(taskId);
        const snap = await taskRef.get();

        if (!snap.exists) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        const task = snap.data();
        if (task.userId !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (status !== undefined) {
            const valid = ["pending", "done"];
            if (!valid.includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status" });
            }
            updateFields.status = status;
        }

        if (dueDate !== undefined) {
            if (dueDate === null || dueDate === "") {
                updateFields.dueDate = null;
            } else {
                const parsed = new Date(dueDate);
                if (isNaN(parsed.getTime())) {
                    return res.status(400).json({ success: false, message: "Invalid dueDate format" });
                }
                updateFields.dueDate = admin.firestore.Timestamp.fromDate(parsed);
            }
        }

        if (Object.keys(updateFields).length) {
            await taskRef.update(updateFields);
        }

        // 🔔 Send notification
        if (status === "done") {
            await sendNotification(
                userId,
                "Task Completed",
                `Great job! You completed "${title || task.title}".`
            );
        } else {
            await sendNotification(
                userId,
                "Task Updated",
                `Your task "${title || task.title}" was updated.`
            );
        }


        const tasks = await fetchTasksForUser(userId);
        return res.json({ success: true, message: "Task updated", tasks });
    } catch (err) {
        console.error("/tasks PUT error:", err);
        return res.status(500).json({ success: false, message: "Failed to update task" });
    }
});

export default router;