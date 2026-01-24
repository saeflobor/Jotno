// src/components/UserCard.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const UserCard = ({ user, onRemove }) => {
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [activeTab, setActiveTab] = useState("conditions");
  const [healthData, setHealthData] = useState({
    conditions: [],
    medications: [],
    reports: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const [conditionsRes, medicationsRes, reportsRes] = await Promise.all([
        axiosInstance.get(`/api/family/member/${user._id}/conditions`),
        axiosInstance.get(`/api/family/member/${user._id}/medications`),
        axiosInstance.get(`/api/family/member/${user._id}/reports`),
      ]);

      setHealthData({
        conditions: conditionsRes.data.conditions || [],
        medications: medicationsRes.data.medications || [],
        reports: reportsRes.data.reports || [],
      });
    } catch (err) {
      console.error("Failed to fetch health data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch health data on component mount
  useEffect(() => {
    fetchHealthData();
  }, [user._id]);

  const handleViewDetails = () => {
    setShowHealthModal(true);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0.0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-200"
        style={{
          minWidth: 260,
          maxWidth: 320,
        }}
      >
        {/* Pink gradient top bar */}
        <div
          style={{
            height: 6,
            background: "linear-gradient(90deg, rgb(211,46,149), rgb(236,72,153))",
          }}
        />

        <div className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-full text-white font-extrabold"
              style={{
                height: 56,
                width: 56,
                background: "linear-gradient(135deg, rgb(211,46,149), rgb(236,72,153))",
                fontSize: 18,
              }}
            >
              {initials(user.username)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-gray-900 text-lg font-semibold truncate">
                  {user.username}
                </h3>
                {onRemove && (
                  <button
                    onClick={() =>
                      window.confirm("Remove this member?") && onRemove()
                    }
                    className="ml-2 inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-600 truncate">{user.email}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <div className="py-2 px-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600">Gender</div>
              <div className="mt-1 font-medium text-gray-900">{user.gender}</div>
            </div>
          </div>

          {/* Health Info Pills */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-red-50 border border-red-200">
              <span className="text-red-600">❤️</span>
              <span className="text-xs text-red-700 font-medium">
                Chronic Conditions
              </span>
              <span className="ml-auto text-xs font-bold text-red-700 bg-red-200 px-2 py-0.5 rounded-full">
                {healthData.conditions.length}
              </span>
            </div>

            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-purple-50 border border-purple-200">
              <span className="text-purple-600">📄</span>
              <span className="text-xs text-purple-700 font-medium">
                Medical Reports
              </span>
              <span className="ml-auto text-xs font-bold text-purple-700 bg-purple-200 px-2 py-0.5 rounded-full">
                {healthData.reports.length}
              </span>
            </div>
          </div>

          {/* View All Details Button */}
          <button
            onClick={handleViewDetails}
            className="mt-4 w-full py-2.5 rounded-lg font-semibold text-sm bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/80 text-white transition-all"
          >
            View All Details →
          </button>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="text-xs text-gray-500">Member since</div>
            <div className="text-xs text-gray-700 font-medium">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Health Details Modal */}
      <AnimatePresence>
        {showHealthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowHealthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl bg-white"
              style={{
                maxHeight: "90vh",
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.username}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Health Details</p>
                  </div>
                  <button
                    onClick={() => setShowHealthModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mt-6 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("conditions")}
                    className={`pb-3 px-1 text-sm font-semibold transition-all ${
                      activeTab === "conditions"
                        ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    ❤️ Conditions
                  </button>
                  <button
                    onClick={() => setActiveTab("medications")}
                    className={`pb-3 px-1 text-sm font-semibold transition-all ${
                      activeTab === "medications"
                        ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    💊 Medications
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`pb-3 px-1 text-sm font-semibold transition-all ${
                      activeTab === "reports"
                        ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    📄 Reports
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto bg-white" style={{ maxHeight: "60vh" }}>
                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading...
                  </div>
                ) : (
                  <>
                    {/* Conditions Tab */}
                    {activeTab === "conditions" && (
                      <div className="space-y-3">
                        {healthData.conditions.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            No chronic conditions
                          </div>
                        ) : (
                          healthData.conditions.map((condition) => (
                            <div
                              key={condition._id}
                              className="p-4 rounded-xl bg-red-50 border border-red-200"
                            >
                              <h3 className="text-lg font-bold text-gray-900">
                                {condition.conditionName}
                              </h3>
                              <div className="mt-2 flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    condition.severityLevel === "severe"
                                      ? "bg-red-200 text-red-800"
                                      : condition.severityLevel === "moderate"
                                      ? "bg-orange-200 text-orange-800"
                                      : "bg-yellow-200 text-yellow-800"
                                  }`}
                                >
                                  {condition.severityLevel}
                                </span>
                                <span className="text-xs text-gray-600">
                                  Diagnosed:{" "}
                                  {new Date(condition.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Medications Tab */}
                    {activeTab === "medications" && (
                      <div className="space-y-3">
                        {healthData.medications.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            No medications
                          </div>
                        ) : (
                          healthData.medications.map((medication) => (
                            <div
                              key={medication._id}
                              className="p-4 rounded-xl bg-purple-50 border border-purple-200"
                            >
                              <h3 className="text-lg font-bold text-gray-900">
                                {medication.medicationName}
                              </h3>
                              <div className="mt-2 space-y-1 text-sm">
                                <p className="text-gray-700">
                                  <span className="text-gray-600">Dosage:</span>{" "}
                                  {medication.dosage}
                                </p>
                                <p className="text-gray-700">
                                  <span className="text-gray-600">Frequency:</span>{" "}
                                  {medication.frequency}
                                </p>
                                <p className="text-gray-700">
                                  <span className="text-gray-600">Duration:</span>{" "}
                                  {medication.duration} days
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Reports Tab */}
                    {activeTab === "reports" && (
                      <div className="space-y-3">
                        {healthData.reports.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            No medical reports
                          </div>
                        ) : (
                          healthData.reports.map((report) => (
                            <div
                              key={report._id}
                              className="p-4 rounded-xl flex items-center justify-between bg-blue-50 border border-blue-200"
                            >
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {report.category || "Medical Report"}
                                </h3>
                                <div className="mt-1 space-y-1 text-sm">
                                  <p className="text-gray-600">
                                    Report Date:{" "}
                                    {report.reportDate
                                      ? new Date(report.reportDate).toLocaleDateString()
                                      : new Date(report.createdAt).toLocaleDateString()}
                                  </p>
                                  {report.notes && (
                                    <p className="text-gray-700">Notes: {report.notes}</p>
                                  )}
                                </div>
                              </div>
                              <a
                                href={report.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-lg font-semibold text-sm bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/80 text-white"
                              >
                                View 📄
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserCard;
