import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiFileText, FiChevronRight, FiLogOut, FiEdit2 } from "react-icons/fi";
import {
  MdAccountCircle,
  MdClose,
  MdWarningAmber,
} from "react-icons/md";
import { PiPillBold, PiUsersBold, PiHeartbeatBold } from "react-icons/pi";
import {
  Pill,
  X,
  Activity,
  FileText,
  Clock,
  Shield,
  AlertTriangle,
  Heart,
  Stethoscope,
  ChevronRight,
  TrendingUp,
  Bell,
} from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [sendingSOS, setSendingSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activities, setActivities] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const profileRef = useRef(null);
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
          className="flex flex-col items-center gap-3"
        >
          <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Fetch activities and health summary
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchData = async () => {
      try {
        const [activitiesRes, summaryRes] = await Promise.all([
          axios.get("/api/activities", { headers }),
          axios.get("/api/health/summary", { headers }),
        ]);
        if (activitiesRes?.data?.activities) {
          setActivities(activitiesRes.data.activities);
        }
        if (summaryRes?.data?.summary) {
          setHealthSummary(summaryRes.data.summary);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchData();
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const family = user?.family || {};
  const familyCount =
    (Array.isArray(family.children) ? family.children.length : 0) +
    (family.father ? 1 : 0) +
    (family.mother ? 1 : 0) +
    (family.spouse ? 1 : 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const sendSOS = async () => {
    setSosMessage("");
    setSendingSOS(true);
    try {
      const response = await axios.post(
        "/api/family/sos",
        { message: "I need help" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const emailCount = response.data?.sentTo?.emails?.length || 0;
      const whatsappCount = response.data?.sentTo?.whatsapp?.length || 0;
      setSosMessage(
        `SOS alert sent successfully — ${emailCount} email(s), ${whatsappCount} WhatsApp message(s)`
      );
    } catch (err) {
      setSosMessage(err.response?.data?.message || "Failed to send SOS alert");
    } finally {
      setSendingSOS(false);
      setTimeout(() => setSosMessage(""), 5000);
    }
  };

  const handleSignOut = () => {
    setShowProfileDropdown(false);
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

  const getActivityIcon = (action) => {
    switch (action) {
      case "uploaded_report":
        return <FileText className="w-3.5 h-3.5" />;
      case "deleted_report":
        return <X className="w-3.5 h-3.5" />;
      case "added_condition":
      case "added_medication":
        return <Pill className="w-3.5 h-3.5" />;
      case "added_family_member":
      case "sent_family_request":
      case "accepted_family_request":
      case "family_request_accepted":
        return <PiUsersBold className="w-3.5 h-3.5" />;
      case "removed_family_member":
      case "declined_family_request":
      case "cancelled_family_request":
        return <X className="w-3.5 h-3.5" />;
      case "sent_sos":
        return <Activity className="w-3.5 h-3.5" />;
      default:
        return <Activity className="w-3.5 h-3.5" />;
    }
  };

  const getActivityColor = (action) => {
    if (
      action.includes("added") ||
      action.includes("uploaded") ||
      action.includes("accepted")
    ) {
      return "text-emerald-600 bg-emerald-50";
    }
    if (
      action.includes("deleted") ||
      action.includes("removed") ||
      action.includes("declined") ||
      action.includes("cancelled")
    ) {
      return "text-red-500 bg-red-50";
    }
    if (
      action.includes("sent_family_request") ||
      action.includes("sent_sos")
    ) {
      return "text-amber-600 bg-amber-50";
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

  const statCards = [
    {
      label: "Conditions",
      value: healthSummary?.chronicConditionsCount ?? "—",
      icon: <Heart className="w-5 h-5" />,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Medications",
      value: healthSummary?.medicationsCount ?? "—",
      icon: <Pill className="w-5 h-5" />,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Reports",
      value: healthSummary?.medicalReportsCount ?? "—",
      icon: <FileText className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Family",
      value: familyCount,
      icon: <PiUsersBold className="w-5 h-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const navCards = [
    {
      title: "Medical Records",
      description: "Conditions, medications, and reports",
      icon: <Stethoscope className="w-6 h-6" />,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      path: "/profile-activity",
      stat: healthSummary
        ? `${healthSummary.chronicConditionsCount + healthSummary.medicationsCount + healthSummary.medicalReportsCount} records`
        : null,
    },
    {
      title: "Family Management",
      description: "Connect and manage your family",
      icon: <PiUsersBold className="w-6 h-6" />,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      path: "/family-integration",
      stat: familyCount > 0 ? `${familyCount} member${familyCount !== 1 ? "s" : ""}` : null,
    },
    {
      title: "Lookup Medicines",
      description: "Search 21,000+ medicines",
      icon: <PiPillBold className="w-6 h-6" />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      path: "/lookup-meds",
      stat: "BD database",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Greeting */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-400 font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Right: SOS + Profile */}
            <div className="flex items-center gap-3">
              {/* SOS */}
              <motion.button
                onClick={sendSOS}
                disabled={sendingSOS}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="relative px-5 py-2 rounded-full text-white font-bold text-sm shadow-md transition disabled:opacity-60 flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                }}
              >
                <Shield className="w-4 h-4" />
                {sendingSOS ? "Sending..." : "SOS"}
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping" />
              </motion.button>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <motion.button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {user.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.username}
                  </span>
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                    >
                      {/* User info */}
                      <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {user.username?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {user.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
                        <div className="p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {healthSummary?.medicationsCount ?? 0}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase">
                            Meds
                          </p>
                        </div>
                        <div className="p-3 text-center border-x border-gray-100">
                          <p className="text-lg font-bold text-gray-900">
                            {healthSummary?.medicalReportsCount ?? 0}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase">
                            Reports
                          </p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {familyCount}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase">
                            Family
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate("/profile-update");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                          <FiEdit2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 font-medium">
                            Edit Profile
                          </span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition text-left"
                        >
                          <FiLogOut className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">
                            Sign Out
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* SOS Message Toast */}
        <AnimatePresence>
          {sosMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-sm ${
                  sosMessage.includes("Failed")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {sosMessage.includes("Failed") ? (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 flex-shrink-0" />
                )}
                {sosMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timezone Mismatch Banner */}
        {user.timezone &&
          user.timezone !==
            Intl.DateTimeFormat().resolvedOptions().timeZone && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 text-amber-800">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <MdWarningAmber className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Timezone Mismatch</p>
                  <p className="text-xs mt-0.5">
                    Account:{" "}
                    <span className="font-semibold">{user.timezone}</span> —
                    Current:{" "}
                    <span className="font-semibold">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ml-11 sm:ml-0">
                <button
                  onClick={async () => {
                    try {
                      const newTz =
                        Intl.DateTimeFormat().resolvedOptions().timeZone;
                      const res = await axios.put(
                        "/api/users/update",
                        { timezone: newTz },
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                          },
                        }
                      );
                      if (res.data.success) {
                        setUser(res.data.user);
                        setSosMessage("Timezone updated successfully!");
                        setTimeout(() => setSosMessage(""), 3000);
                      }
                    } catch {
                      setSosMessage("Failed to update timezone");
                      setTimeout(() => setSosMessage(""), 3000);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                >
                  Update Timezone
                </button>
              </div>
            </motion.div>
          )}

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {getGreeting()},{" "}
            <span className="bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] bg-clip-text text-transparent">
              {user.username}
            </span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Here&apos;s an overview of your health profile
          </p>
        </motion.div>

        {/* Health Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          {statCards.map((stat, idx) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}
                >
                  {stat.icon}
                </div>
                {loadingSummary ? (
                  <div className="w-8 h-6 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Navigation Cards + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Navigation Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Quick Access
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {navCards.map((card, idx) => (
                <motion.button
                  key={card.title}
                  onClick={() => navigate(card.path)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  className="relative bg-white rounded-xl p-5 text-left border border-gray-200 shadow-sm hover:border-pink-200 transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconColor} mb-4 group-hover:scale-110 transition-transform`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                  {card.stat && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase">
                        {card.stat}
                      </span>
                    </div>
                  )}
                  <FiChevronRight className="absolute top-5 right-4 w-4 h-4 text-gray-300 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right: Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Recent Activity
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {activities.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {activities.slice(0, 8).map((activity) => (
                    <div
                      key={activity._id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 transition"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getActivityColor(activity.action)}`}
                      >
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-700 leading-snug line-clamp-2">
                          {activity.description}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    No activity yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your recent actions will appear here
                  </p>
                </div>
              )}
              {activities.length > 8 && (
                <button
                  onClick={() => navigate("/profile-activity")}
                  className="w-full px-4 py-3 text-xs font-semibold text-pink-600 hover:bg-pink-50/50 transition border-t border-gray-100 flex items-center justify-center gap-1"
                >
                  View all activity
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
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
  );
};

export default Dashboard;
