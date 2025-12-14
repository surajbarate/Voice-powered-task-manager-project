import { getAuth } from "firebase/auth";

export const API_BASE = "http://localhost:5000";

export const fetchWithAuth = async (url, options = {}) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.error("User not logged in");
        return { success: false, message: "You are not logged in" };
    }

    // Always get fresh Firebase ID token
    const token = await user.getIdToken();

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(API_BASE + url, { ...options, headers });

    return response.json();
};
