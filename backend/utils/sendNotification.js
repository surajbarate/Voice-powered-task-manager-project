import admin from "../firebaseAdmin.js";

export const sendNotification = async (userId, title, body) => {
    try {
        console.log("🔔 Attempting to send notification...");
        console.log("   User ID:", userId);
        console.log("   Title:", title);
        console.log("   Body:", body);

        const doc = await admin.firestore().collection("fcmTokens").doc(userId).get();

        if (!doc.exists) {
            console.error("❌ No FCM token document found!");
            console.error("   Collection: fcmTokens");
            console.error("   Document ID:", userId);
            console.error("   → Token was never saved or wrong userId");
            return;
        }

        console.log("✅ Token document found");
        const tokenData = doc.data();
        console.log("📄 Document data:", tokenData);

        const token = tokenData?.token;

        if (!token) {
            console.error("❌ Token field is missing or undefined!");
            console.error("   Available fields:", Object.keys(tokenData));
            return;
        }

        console.log("✅ Token retrieved:", token.substring(0, 30) + "...");

        const result = await admin.messaging().send({
            token,
            notification: {
                title,
                body,
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
            }
        });

        console.log("✅ Notification sent successfully!");
        console.log("   Message ID:", result);

    } catch (err) {
        console.error("❌ FCM Send Error:");
        console.error("   Error code:", err.code);
        console.error("   Error message:", err.message);
        if (err.code === 'messaging/invalid-registration-token') {
            console.error("   → Token is invalid or expired");
        }
        if (err.code === 'messaging/registration-token-not-registered') {
            console.error("   → Token is not registered with FCM");
        }
    }
};


