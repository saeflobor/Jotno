import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FamilyIntegration from "./pages/FamilyIntegration";
import EmailVerification from "./pages/EmailVerification";
import VerifyEmailChange from "./pages/VerifyEmailChange";
import NotFound from "./components/NotFound";
import Footer from "./components/Footer";
import ProfileActivity from "./pages/ProfileActivity";
import ProfileUpdatePage from "./pages/ProfileUpdatePage";
import LookupMeds from "./pages/LookupMeds";
import ResetPassword from "./pages/ResetPassword";
import { useEffect, useState } from "react";
import axios from "./lib/axios";

function AppContent({ user, setUser, error, isLoading }) {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/reset-password');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-pink-200 border-t-[rgb(211,46,149)] rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!hideNavbar && <Navbar user={user} setUser={setUser} />}
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Home user={user} error={error} />} />

        {/*Email Verification Page */}
        <Route
          path="/verifyemail/:token"
          element={<EmailVerification setUser={setUser} />}
        />

        {/*Email Change Verification Page */}
        <Route
          path="/verify-email-change/:token"
          element={<VerifyEmailChange setUser={setUser} />}
        />

        {/* Password Reset Page */}
        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Protected Dashboard page */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} setUser={setUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile-activity"
          element={
            user ? (
              <ProfileActivity user={user} setUser={setUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Family Integration page */}
        <Route
          path="/family-integration"
          element={
            user ? (
              <FamilyIntegration user={user} setUser={setUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Profile Update page */}
        <Route
          path="/profile-update"
          element={
            user ? (
              <ProfileUpdatePage user={user} setUser={setUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Lookup Meds page */}
        <Route
          path="/lookup-meds"
          element={
            user ? (
              <LookupMeds />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Login & Register */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />
          }
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <Register />}
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNavbar && <Footer />}
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get(`/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        } catch (err) {
          setError("Failed to fetch user data");
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <Router>
      <AppContent user={user} setUser={setUser} error={error} isLoading={isLoading} />
    </Router>
  );
}

export default App;
