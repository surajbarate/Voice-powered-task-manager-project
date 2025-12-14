import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const Sign = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        console.log("Full Name:", fullName);
        console.log("Email:", email);
        console.log("Password:", password); // ⭐ debugging check

        try {
            // FIRST: Create user in Firebase Auth
            const userCredential = await signup(email, password);
            const user = userCredential.user;

            // SECOND: Store fullName in Firestore
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: user.email,
                createdAt: new Date(),
            });

            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
                {error && <p className="text-red-600 mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full p-3 border rounded"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-3 border rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-3 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 transition"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="mt-4 text-center text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Sign;
