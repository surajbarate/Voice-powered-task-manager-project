// AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Signup function
    const signup = async (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    // Login function
    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Logout
    const logout = () => {
        return signOut(auth);
    };

    // Check auth state on app load
    useEffect(() => {
        console.log("🔐 Setting up auth listener...");

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("🔐 Auth state changed:", user ? `User logged in: ${user.email}` : "User logged out");

            if (user) {
                try {
                    // Fetch extra user profile from Firestore
                    const userRef = doc(db, "users", user.uid);
                    const userSnap = await getDoc(userRef);

                    let fullUser = {
                        uid: user.uid,
                        email: user.email,
                    };

                    if (userSnap.exists()) {
                        fullUser.fullName = userSnap.data().fullName;
                        console.log("✅ User profile loaded:", fullUser.fullName);
                    } else {
                        console.warn("⚠️ No user profile found in Firestore");
                    }

                    // Get Firebase ID token
                    const token = await user.getIdToken(true);
                    console.log("✅ Firebase ID Token obtained");
                    fullUser.token = token;

                    setCurrentUser(fullUser);
                    console.log("✅ Current user set:", fullUser.email);

                    // Set loading false AFTER user is set
                    setLoading(false);
                    console.log("✅ Auth loading complete (user found)");
                } catch (error) {
                    console.error("❌ Error loading user data:", error);
                    setCurrentUser(null);
                    setLoading(false);
                }
            } else {
                setCurrentUser(null);
                console.log("✅ Current user cleared");
                setLoading(false);
                console.log("✅ Auth loading complete (no user)");
            }
        });

        return () => {
            console.log("🔐 Cleaning up auth listener");
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        loading,
        signup,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};