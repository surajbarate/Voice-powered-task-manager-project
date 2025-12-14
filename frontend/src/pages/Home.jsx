import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mic, CheckCircle, Clock, Shield } from "lucide-react";

const Home = () => {
    const { currentUser } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">

            {/* HERO SECTION */}
            <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                    Voice-Powered <br />
                    <span className="text-yellow-300">Task Manager</span>
                </h1>

                <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 opacity-90">
                    Manage your daily tasks effortlessly using smart voice commands.
                    Stay productive, organized, and hands-free.
                </p>

                {/* CTA BUTTONS */}
                <div className="flex justify-center gap-4 flex-wrap">
                    {!currentUser ? (
                        <>
                            <Link
                                to="/login"
                                className="bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition"
                            >
                                Login
                            </Link>

                            <Link
                                to="/signin"
                                className="bg-yellow-400 text-black font-semibold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition"
                            >
                                Get Started
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/dashboard"
                            className="bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition"
                        >
                            Go to Dashboard
                        </Link>
                    )}
                </div>
            </div>

            {/* FEATURES SECTION */}
            <div className="bg-white text-gray-800 py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-14">
                        Why Choose Our App?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                        <FeatureCard
                            icon={<Mic size={36} />}
                            title="Voice Commands"
                            desc="Add, delete, and manage tasks using natural voice input."
                        />

                        <FeatureCard
                            icon={<CheckCircle size={36} />}
                            title="Smart Organization"
                            desc="Automatically organize tasks with priorities & due dates."
                        />

                        <FeatureCard
                            icon={<Clock size={36} />}
                            title="Reminders"
                            desc="Get notified on time so you never miss important tasks."
                        />

                        <FeatureCard
                            icon={<Shield size={36} />}
                            title="Secure & Private"
                            desc="Your data is safe with authentication and cloud security."
                        />
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="py-6 text-center text-sm opacity-80">
                © {new Date().getFullYear()} Voice-Powered Task Manager • Built with ❤️
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-gray-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition text-center">
        <div className="flex justify-center text-indigo-600 mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-gray-600">{desc}</p>
    </div>
);

export default Home;
