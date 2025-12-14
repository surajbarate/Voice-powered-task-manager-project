
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Sign from './pages/Sign';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AuthProvider } from "../src/context/AuthContext"
import PrivateRoute from './PrivateRoute';
import { useEffect } from 'react';
import { messaging } from "./firebase";
import { onMessage } from "firebase/messaging";

function App() {

  useEffect(() => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message:", payload);
      alert(payload.notification.title + "\n" + payload.notification.body);
    });
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Sign />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          <Route path="/dashboard" element={<PrivateRoute> <Dashboard /> </PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
