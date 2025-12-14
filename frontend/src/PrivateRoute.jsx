// PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../src/context/AuthContext";

const PrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    // After loading completes, redirect based on auth status
    return currentUser ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;