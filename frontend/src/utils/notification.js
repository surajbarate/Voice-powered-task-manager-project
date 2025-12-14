

import { messaging } from "../firebase";
import { getToken } from "firebase/messaging";

export const requestFCMToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied");
            return null;
        }

        const token = await getToken(messaging, {
            vapidKey: "your-public-vapid-key-here",
            serviceWorkerRegistration: await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js"
            ),
        });

        console.log("FCM token:", token);
        return token;
    } catch (err) {
        console.error("Error getting FCM token", err);
        return null;
    }
};

