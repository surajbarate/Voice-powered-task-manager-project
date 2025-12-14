import express from "express";
import admin from "firebase-admin";


const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: "Token missing" });
        }

        const decoded = await admin.auth().verifyIdToken(token);

        return res.json({
            success: true,
            uid: decoded.uid,
            email: decoded.email,
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
            error: error.message,
        });
    }
});

export default router;
