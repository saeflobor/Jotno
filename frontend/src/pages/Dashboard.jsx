import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiFileText } from "react-icons/fi";
import { MdAccountCircle, MdSettings, MdArrowBack } from "react-icons/md";
import { PiPillBold } from "react-icons/pi";
import { PiUsersBold } from "react-icons/pi";
import { Pill, X, Activity, FileText, Clock } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [sendingSOS, setSendingSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    isDangerous: false,
    onConfirm: null,
  });
  
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

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const activitiesRes = await axios.get("/api/activities", { headers });
        if (activitiesRes?.data?.activities) {
          setActivities(activitiesRes.data.activities);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchActivities();
  }, []);
  
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
    setConfirmation({
      isOpen: true,
      title: "Sign Out",
      message: "Are you sure you want to sign out from your account?",
      isDangerous: true,
      confirmText: "Sign Out",
      onConfirm: () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
      },
    });
  };

  const familyCount = (Array.isArray(family.children) ? family.children.length : 0) +
    (family.father ? 1 : 0) +
    (family.mother ? 1 : 0) +
    (family.spouse ? 1 : 0);

  const getActivityIcon = (action) => {
    switch (action) {
      case "uploaded_report":
        return <FileText className="w-4 h-4" />;
      case "deleted_report":
        return <X className="w-4 h-4" />;
      case "added_condition":
      case "added_medication":
        return <Pill className="w-4 h-4" />;
      case "added_family_member":
      case "sent_family_request":
      case "accepted_family_request":
      case "family_request_accepted":
        return <PiUsersBold className="w-4 h-4" />;
      case "removed_family_member":
      case "declined_family_request":
      case "cancelled_family_request":
        return <X className="w-4 h-4" />;
      case "sent_sos":
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (action) => {
    if (action.includes("added") || action.includes("uploaded") || action.includes("accepted")) {
      return "text-green-600 bg-green-50";
    }
    if (action.includes("deleted") || action.includes("removed") || action.includes("declined") || action.includes("cancelled")) {
      return "text-red-600 bg-red-50";
    }
    if (action.includes("sent_family_request") || action.includes("sent_sos")) {
      return "text-orange-600 bg-orange-50";
    }
    return "text-blue-600 bg-blue-50";
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return new Date(date).toLocaleDateString();
  };

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

              <div className="px-6 pt-6">
                <div className="text-sm text-gray-600">
                  Dashboard / <span className="font-semibold text-gray-900">Dashboard</span>
                </div>
              </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Right Profile */}
        <div className="flex justify-end items-center p-6 pr-8">
          <motion.button
            onClick={() => setShowProfileModal(!showProfileModal)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
            title="View Profile"
          >
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-300 shadow-md"
              whileHover={{ boxShadow: "0px 8px 24px rgba(211, 46, 149, 0.4)" }}
            >
              <MdAccountCircle className="text-5xl text-[rgb(211,46,149)]" />
            </motion.div>
          </motion.button>
        </div>

        {/* Profile Modal */}
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProfileModal(false)}
            className="fixed inset-0 backdrop-blur-md z-40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <motion.div
                  className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 mb-4"
                >
                  <MdAccountCircle className="text-7xl text-[rgb(211,46,149)]" />
                </motion.div>
                <h2 className="text-2xl font-semibold text-gray-900">{user.username}</h2>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Gender</p>
                  <p className="text-sm font-semibold text-gray-900">{user.gender}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Family</p>
                  <p className="text-sm font-semibold text-gray-900">{familyCount} members</p>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => {
                    setShowProfileModal(false);
                    navigate("/profile-update");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white py-2 rounded-4xl font-medium transition hover:shadow-md"
                >
                  Edit Profile
                </motion.button>
                <motion.button
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-red-500 text-white py-2 rounded-4xl font-medium transition hover:shadow-md"
                >
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SOS Button */}
        <div className="flex justify-center py-6">
          <motion.button
            onClick={sendSOS}
            disabled={sendingSOS}
            whileHover={{ scale: 1.08, boxShadow: "0px 12px 32px rgba(255, 31, 75, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-4 rounded-full text-white font-bold text-lg shadow-lg transition disabled:opacity-60"
            style={{
              background: "linear-gradient(90deg,#ff1f4b,#ff5f6d)",
            }}
          >
            {sendingSOS ? "Sending..." : "SOS"}
          </motion.button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-start justify-center px-4 pt-40 pb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            className="w-full max-w-6xl"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Medical Records */}
                <motion.button
                  onClick={() => navigate("/profile-activity")}
                  whileHover={{ y: -4, boxShadow: "0px 20px 40px rgba(211, 46, 149, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                  animate={{ opacity: 1, y: 0, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                  // transition={{ duration: 0, delay: 0.5 }}
                  className="relative rounded-4xl p-6 text-left bg-white border border-gray-200 transition w-full h-50"
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
                  // transition={{ duration: 0, delay: 0.55 }}
                  className="relative rounded-4xl p-6 text-left bg-white border border-gray-200 transition w-full h-50"
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
                  onClick={() => {
                    setSosMessage("Lookup Meds feature is coming soon!");
                    setTimeout(() => setSosMessage(""), 4000);
                  }}
                  whileHover={{ y: -4, boxShadow: "0px 20px 40px rgba(211, 46, 149, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                  animate={{ opacity: 1, y: 0, boxShadow: "0px 0px 0px rgba(211, 46, 149, 0)" }}
                  // transition={{ duration: 0, delay: 0.6 }}
                  className="relative rounded-4xl p-6 text-left bg-white border border-gray-200 transition opacity-50 cursor-not-allowed w-full h-50"
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

            {/* Recent Activity Section */}
            {activities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 bg-white rounded-2xl shadow-md p-6 border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Activity
                  </h2>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activities.slice(0, 10).map((activity) => (
                    <div
                      key={activity._id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(
                          activity.action,
                        )}`}
                      >
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          isDangerous={confirmation.isDangerous}
          confirmText={confirmation.confirmText || "Confirm"}
          onConfirm={() => {
            if (confirmation.onConfirm) {
              confirmation.onConfirm();
            }
            setConfirmation({ ...confirmation, isOpen: false });
          }}
          onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
        />
      </div>
    </div>
  );
};

export default Dashboard;
