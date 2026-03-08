import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
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
import { useTranslation } from "react-i18next";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
          <p className="text-sm text-gray-500">{t('dashboard.loading')}</p>
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
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const sendSOS = async () => {
    setSosMessage("");
    setSendingSOS(true);
    try {
      const response = await axios.post(
        "/api/family/sos",
        { message: t('dashboard.sosMessage') },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const emailCount = response.data?.sentTo?.emails?.length || 0;
      const whatsappCount = response.data?.sentTo?.whatsapp?.length || 0;
      setSosMessage(
        t('dashboard.sosSent', { emailCount, whatsappCount })
      );
    } catch (err) {
      setSosMessage(err.response?.data?.message || t('dashboard.sosFailed'));
    } finally {
      setSendingSOS(false);
      setTimeout(() => setSosMessage(""), 5000);
    }
  };

  const handleSignOut = () => {
    setShowProfileDropdown(false);
    setConfirmation({
      isOpen: true,
      title: t('dashboard.signOutTitle'),
      message: t('dashboard.signOutMessage'),
      isDangerous: true,
      confirmText: t('dashboard.signOut'),
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
    if (seconds < 60) return t('dashboard.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}${t('dashboard.mAgo')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${t('dashboard.hAgo')}`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}${t('dashboard.dAgo')}`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}${t('dashboard.wAgo')}`;
    return new Date(date).toLocaleDateString();
  };

  const stats = [
    {
      label: t('dashboard.conditions'),
      value: healthSummary?.chronicConditionsCount ?? "—",
      icon: <Heart className="w-4 h-4" />,
      color: "text-rose-600",
      bg: "bg-rose-50",
      accent: "border-rose-300",
    },
    {
      label: t('dashboard.medications'),
      value: healthSummary?.medicationsCount ?? "—",
      icon: <Pill className="w-4 h-4" />,
      color: "text-orange-600",
      bg: "bg-orange-50",
      accent: "border-orange-300",
    },
    {
      label: t('dashboard.reportsLabel'),
      value: healthSummary?.medicalReportsCount ?? "—",
      icon: <FileText className="w-4 h-4" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      accent: "border-blue-300",
    },
    {
      label: t('dashboard.familyLabel'),
      value: familyCount,
      icon: <PiUsersBold className="w-4 h-4" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      accent: "border-purple-300",
    },
  ];

  const navCards = [
    {
      title: t('dashboard.medicalRecords'),
      description: t('dashboard.medicalRecordsSub'),
      icon: <Stethoscope className="w-6 h-6" />,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      path: "/profile-activity",
      stat: healthSummary
        ? `${healthSummary.chronicConditionsCount + healthSummary.medicationsCount + healthSummary.medicalReportsCount} ${t('dashboard.records')}`
        : null,
    },
    {
      title: t('dashboard.familyManagement'),
      description: t('dashboard.familyManagementSub'),
      icon: <PiUsersBold className="w-6 h-6" />,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      path: "/family-integration",
      stat: familyCount > 0 ? `${familyCount} ${t('dashboard.members')}` : null,
    },
    {
      title: t('dashboard.lookupMeds'),
      description: t('dashboard.lookupMedsSub'),
      icon: <PiPillBold className="w-6 h-6" />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      path: "/lookup-meds",
      stat: "Medex database",
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

            {/* Right: Profile */}
            <div className="flex items-center gap-3">
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
                      className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
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
                          {t('dashboard.meds')}
                          </p>
                        </div>
                        <div className="p-3 text-center border-x border-gray-100">
                          <p className="text-lg font-bold text-gray-900">
                            {healthSummary?.medicalReportsCount ?? 0}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase">
                            {t('dashboard.reports')}
                          </p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {familyCount}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase">
                            {t('dashboard.family')}
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
                          {t('dashboard.editProfile')}
                          </span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition text-left"
                        >
                          <FiLogOut className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">
                          {t('dashboard.signOut')}
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
                  <p className="font-semibold text-sm">{t('dashboard.timezoneMismatch')}</p>
                  <p className="text-xs mt-0.5">
                    {t('dashboard.timezoneAccount')}{" "}
                    <span className="font-semibold">{user.timezone}</span> —
                    {" "}{t('dashboard.timezoneCurrent')}{" "}
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
                        setSosMessage(t('dashboard.timezoneUpdated'));
                        setTimeout(() => setSosMessage(""), 3000);
                      }
                    } catch {
                      setSosMessage(t('dashboard.timezoneFailed'));
                      setTimeout(() => setSosMessage(""), 3000);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                >
                  {t('dashboard.updateTimezone')}
                </button>
              </div>
            </motion.div>
          )}

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {getGreeting()}, {user.username}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t('dashboard.healthSnapshot')}
          </p>
        </motion.div>

        {/* Health Overview — Stat Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.04 }}
              className={`bg-white rounded-xl border border-gray-200 border-l-[3px] ${stat.accent} px-4 py-3.5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}
                >
                  {stat.icon}
                </div>
              </div>
              {loadingSummary ? (
                <div className="w-8 h-6 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-xl font-bold text-gray-900">
                  {stat.value}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Main Feature Cards */}
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t('dashboard.quickAccess')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {navCards.map((card, idx) => (
            <motion.button
              key={card.title}
              onClick={() => navigate(card.path)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + idx * 0.06 }}
              whileHover={{
                y: -4,
                boxShadow: "0 16px 48px rgba(0,0,0,0.08)",
              }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-white rounded-2xl p-6 text-left border border-gray-200 shadow-sm hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconColor} group-hover:scale-105 transition-transform`}
                >
                  {card.icon}
                </div>
                <FiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {card.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                {card.description}
              </p>
              {card.stat && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    {card.stat}
                  </span>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t('dashboard.recentActivity')}
            </h2>
            {activities.length > 5 && (
              <button
                onClick={() => navigate("/profile-activity")}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
              >
                {t('dashboard.viewAll')}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {activities.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {activities.slice(0, 6).map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.action)}`}
                    >
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 leading-snug truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Clock className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  {t('dashboard.noActivity')}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* SOS Emergency Button — Fixed Bottom */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          onClick={sendSOS}
          disabled={sendingSOS}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="group relative flex items-center gap-2 sm:gap-2.5 bg-red-600 hover:bg-red-700 text-white pl-4 sm:pl-5 pr-5 sm:pr-6 py-3 sm:py-3.5 rounded-full shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="block text-xs sm:text-sm font-bold leading-tight">
              {sendingSOS ? t('dashboard.sending') : t('dashboard.emergencySOS')}
            </span>
            <span className="hidden sm:block text-[10px] text-red-200 font-medium leading-tight">
              {t('dashboard.alertFamily')}
            </span>
          </div>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-300 rounded-full animate-ping" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-300 rounded-full" />
        </motion.button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        isDangerous={confirmation.isDangerous}
        confirmText={confirmation.confirmText || t('confirm')}
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
