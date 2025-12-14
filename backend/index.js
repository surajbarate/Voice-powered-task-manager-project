// index.js

import dotenv from "dotenv";
dotenv.config(); // <-- MUST be first

import fs from "fs";


import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import verifyUserRoute from "./routes/verifyUser.js";
import authenticateUser from "./authenticateUser.js";
import taskRoute from "./routes/tasks.js";
import { db } from "./firebaseAdmin.js";
import saveToken from "./routes/saveToken.js"

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Firebase + Node.js server is running!");
});

// Routes
app.use("/verifyUser", verifyUserRoute);
app.use("/tasks", taskRoute);
app.use("/save-fcm-token", saveToken);

// console.log("Gemini Key:", process.env.GEMINI_API_KEY);

app.post("/test", (req, res) => {
    res.json({ success: true, message: "Test route works!" });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
