import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiFileText } from "react-icons/fi";
import { MdAccountCircle, MdSettings, MdArrowBack } from "react-icons/md";
import { PiPillBold } from "react-icons/pi";
import { PiUsersBold } from "react-icons/pi";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [sendingSOS, setSendingSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-pink-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl text-gray-900"
        >
          Loading user data...
        </motion.div>
      </div>
    );
  }
  
  const family = user?.family || {};

  const sendSOS = async () => {
    setSosMessage("");
    setSendingSOS(true);
    try {
      await axios.post(
        "/api/family/sos",
        { message: "I need help" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSosMessage("SOS sent to your family members.");
    } catch (err) {
      setSosMessage(err.response?.data?.message || "Failed to send SOS");
    } finally {
      setSendingSOS(false);
      setTimeout(() => setSosMessage(""), 4000);
    }
  };

  const handleSignOut = () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (confirmed) {
      localStorage.removeItem("token");
      setUser(null);
      navigate("/");
    }
  };

  const familyCount = (Array.isArray(family.siblings) ? family.siblings.length : 0) +
    (Array.isArray(family.children) ? family.children.length : 0) +
    (family.father ? 1 : 0) +
    (family.mother ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-pink-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-pink-100/20 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
      />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* SOS Button */}
        <div className="flex justify-center py-4">
          <motion.button
            onClick={sendSOS}
            disabled={sendingSOS}
            whileHover={{ scale: 0.90, opacity: 0.8 }}
            whileTap={{ scale: 0.85 }}
            className="px-6 py-3 rounded-full text-white font-semibold shadow-lg transition disabled:opacity-60"
            style={{
              background: "linear-gradient(90deg,#ff1f4b,#ff5f6d)",
            }}
          >
            {sendingSOS ? "Sending..." : "SOS"}
          </motion.button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            className="w-full max-w-4xl"
          >
            {sosMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex justify-center"
              >
                <div className="px-4 py-2 rounded-lg text-sm text-white bg-gray-800 shadow-md">
                  {sosMessage}
                </div>
              </motion.div>
            )}

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100"
                  >
                    <MdAccountCircle className="text-6xl text-[rgb(211,46,149)]" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{user.username}</h2>
                    <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => navigate("/profile-update")}
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="p-3 rounded-full hover:bg-pink-50 border border-pink-200 transition"
                  title="Update Profile"
                >
                  <MdSettings className="text-2xl text-[rgb(211,46,149)]" />
                </motion.button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Role</p>
                  <p className="text-sm font-semibold text-gray-900">{user.role}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Gender</p>
                  <p className="text-sm font-semibold text-gray-900">{user.gender}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Family</p>
                  <p className="text-sm font-semibold text-gray-900">{familyCount} members</p>
                </div>
              </div>

              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white py-2 rounded-lg font-medium transition hover:shadow-md"
              >
                Sign Out
              </motion.button>
            </motion.div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Medical Records */}
              <motion.button
                onClick={() => navigate("/profile-activity")}
                whileHover={{ y: -4, boxShadow: "0px 20px 40px rgba(211, 46, 149, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                animate={{ opacity: 1, y: 0, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="relative rounded-xl p-6 text-left bg-white border border-gray-200 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <FiFileText className="text-2xl text-purple-600" />
                  </div>
                  <span className="text-2xl text-gray-300">→</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Medical Records</h3>
                <p className="text-sm text-gray-600">View and manage your medical history</p>
              </motion.button>

              {/* Family Management */}
              <motion.button
                onClick={() => navigate("/family-integration")}
                whileHover={{ y: -4, boxShadow: "0px 20px 40px rgba(211, 46, 149, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                animate={{ opacity: 1, y: 0, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="relative rounded-xl p-6 text-left bg-white border border-gray-200 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-pink-100">
                    <PiUsersBold className="text-2xl text-pink-600" />
                  </div>
                  <span className="text-2xl text-gray-300">→</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Family Management</h3>
                <p className="text-sm text-gray-600">Connect and manage family members</p>
              </motion.button>

              {/* Lookup Meds */}
              <motion.button
                onClick={() => alert("Coming soon!")}
                whileHover={{ y: -4, boxShadow: "0px 20px 40px rgba(211, 46, 149, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                animate={{ opacity: 1, y: 0, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="relative rounded-xl p-6 text-left bg-white border border-gray-200 transition opacity-50 cursor-not-allowed"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-red-100">
                    <PiPillBold className="text-2xl text-red-600" />
                  </div>
                  <span className="text-2xl text-gray-300">→</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Lookup Meds</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
