import express from "express";
import admin from "../firebaseAdmin.js";
import authenticateUser from "../authenticateUser.js";
import { db } from "../firebaseAdmin.js";

const router = express.Router();

router.post("/", authenticateUser, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.uid; // ✅ Get actual user ID

        console.log("Received:", req.body);
        console.log("User ID:", userId);

        if (!fcmToken) {
            return res.status(400).json({ error: "Missing fcmToken" });
        }

        // ✅ Save to fcmTokens collection with correct field name
        await db.collection("fcmTokens").doc(userId)
            .set({
                token: fcmToken,  // ✅ Save as "token" not "fcmToken"
                updatedAt: admin.firestore.Timestamp.now()
            }, { merge: true });

        console.log("✅ Token saved for user:", userId);
        res.json({ message: "Token saved successfully" });
    } catch (err) {
        console.error("❌ Error saving token:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
