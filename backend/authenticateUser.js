import admin from "./firebaseAdmin.js"; // import the initialized admin

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        const token = authHeader.split(" ")[1];
        console.log("TOKEN RECEIVED ===>", token);


        // Verify Firebase token
        const decodedValue = await admin.auth().verifyIdToken(token);

        req.user = decodedValue; // attach user details
        next();
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            error: error.message,
        });
    }
};

export default authenticateUser;
