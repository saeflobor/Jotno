import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pill, X, Activity, FileText, Clock, Search, Filter, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddMedicationModal from "../components/AddMedicationModal";
import AddConditionModal from "../components/AddConditionModal";

const ProfileActivity = ({ user, setUser }) => {
  const navigate = useNavigate();

  // ============ EXISTING MEDICAL REPORT STATE ============
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  // ============ NEW HEALTH STATE ============
  const [chronicConditions, setChronicConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);

  const [healthError, setHealthError] = useState("");
  const [healthSuccess, setHealthSuccess] = useState("");
  const [processingHealth, setProcessingHealth] = useState(false);

  // ============ NEW PHASE 2 STATE ============
  const [healthSummary, setHealthSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [uploadFormData, setUploadFormData] = useState({
    category: "Other",
    reportDate: "",
    notes: "",
  });

  // ============ EXISTING MEDICAL REPORT useEffect ============
  useEffect(() => {
    // Fetch existing medical reports for the logged-in user
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/medical-report", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res?.data) setReports(res.data.reports || res.data || []);
      } catch (err) {
        // ignore — backend route may not exist yet
      }
    };
    fetchReports();
  }, []);

  // ============ NEW HEALTH useEffect ============
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch chronic conditions
        const conditionsRes = await axios.get("/api/health/chronic-conditions", {
          headers,
        });
        if (conditionsRes?.data) {
          setChronicConditions(
            conditionsRes.data.conditions || conditionsRes.data || []
          );
        }

        // Fetch medications
        const medicationsRes = await axios.get("/api/health/medications", {
          headers,
        });
        if (medicationsRes?.data) {
          setMedications(
            medicationsRes.data.medications || medicationsRes.data || []
          );
        }

        // Fetch health summary
        const summaryRes = await axios.get("/api/health/summary", { headers });
        if (summaryRes?.data?.summary) {
          setHealthSummary(summaryRes.data.summary);
        }

        // Fetch activities
        const activitiesRes = await axios.get("/api/activities", { headers });
        if (activitiesRes?.data?.activities) {
          setActivities(activitiesRes.data.activities);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchHealthData();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!allowed.includes(selected.type)) {
      setError("Only PNG, JPG or PDF files are allowed");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      // backend expects field name 'file'
      formData.append("file", file);
      formData.append("category", uploadFormData.category);
      formData.append("reportDate", uploadFormData.reportDate);
      formData.append("notes", uploadFormData.notes);

      const token = localStorage.getItem("token");
      const res = await axios.post("/api/medical-report", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        },
      });

      const newReport =
        res?.data?.medicalReport || res?.data?.report || res?.data;
      if (newReport) setReports((p) => [newReport, ...p]);

      // Also update parent `user` state to include new report id so `user.medicalReports` is not empty
      if (newReport && setUser) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                medicalReports: [newReport._id, ...(prev.medicalReports || [])],
              }
            : prev
        );
      }

      // Refresh health summary
      const token2 = localStorage.getItem("token");
      const summaryRes = await axios.get("/api/health/summary", {
        headers: { Authorization: `Bearer ${token2}` },
      });
      if (summaryRes?.data?.summary) {
        setHealthSummary(summaryRes.data.summary);
      }

      // Refresh activities
      const activitiesRes = await axios.get("/api/activities", {
        headers: { Authorization: `Bearer ${token2}` },
      });
      if (activitiesRes?.data?.activities) {
        setActivities(activitiesRes.data.activities);
      }

      setSuccess("File uploaded successfully");
      setFile(null);
      setUploadFormData({ category: "Other", reportDate: "", notes: "" });
      // give time for progress bar to reach 100%
      setTimeout(() => setUploadProgress(0), 400);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;
    try {
      setDeletingIds((p) => [...p, id]);
      const token = localStorage.getItem("token");
      await axios.delete(`/api/medical-report/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setReports((p) => p.filter((r) => (r._id || r.id || r.url) !== id));

      if (setUser) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                medicalReports: (prev.medicalReports || []).filter(
                  (mid) => mid !== id
                ),
              }
            : prev
        );
      }

      // Refresh health summary and activities
      const summaryRes = await axios.get("/api/health/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (summaryRes?.data?.summary) {
        setHealthSummary(summaryRes.data.summary);
      }

      const activitiesRes = await axios.get("/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activitiesRes?.data?.activities) {
        setActivities(activitiesRes.data.activities);
      }

      setSuccess("Document deleted");

      // close preview if the deleted item was open
      if (
        selectedReport &&
        (selectedReport._id || selectedReport.id || selectedReport.url) === id
      ) {
        setSelectedReport(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeletingIds((p) => p.filter((x) => x !== id));
    }
  };

  const openPreview = (r) => setSelectedReport(r);
  const closePreview = () => setSelectedReport(null);

  // close modal on Escape
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedReport(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const renderPreview = () => {
    if (!file) return null;

    const sizeInKB = Math.round(file.size / 1024);

    return (
      <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
        {file.type.startsWith("image/") ? (
          <img
            src={URL.createObjectURL(file)}
            alt="preview"
            className="w-20 h-20 object-cover rounded-md"
          />
        ) : (
          <div className="flex items-center justify-center w-20 h-20 rounded-md bg-pink-50 text-pink-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-2V3a1 1 0 00-1-1H8z" />
            </svg>
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {file.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {file.type} • {sizeInKB} KB
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setError("");
              }}
              className="text-sm text-gray-400 hover:text-gray-600"
              aria-label="Remove file"
            >
              Remove
            </button>
          </div>

          {uploadProgress > 0 && (
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-width"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============ NEW HEALTH FUNCTIONS ============
  const handleAddCondition = async (formData) => {
    try {
      setProcessingHealth(true);
      setHealthError("");
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/health/chronic-conditions", formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res?.data?.condition) {
        setChronicConditions((p) => [res.data.condition, ...p]);
        setHealthSuccess("Chronic condition added");
        setShowConditionModal(false);
        
        // Refresh health summary and activities logic...
        const summaryRes = await axios.get("/api/health/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (summaryRes?.data?.summary) {
          setHealthSummary(summaryRes.data.summary);
        }

        const activitiesRes = await axios.get("/api/activities", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (activitiesRes?.data?.activities) {
          setActivities(activitiesRes.data.activities);
        }

        setTimeout(() => setHealthSuccess(""), 3000);
      }
    } catch (err) {
      setHealthError(err?.response?.data?.message || "Failed to add condition");
    } finally {
      setProcessingHealth(false);
    }
  };

  const handleDeleteCondition = async (id) => {
    if (!window.confirm("Are you sure you want to delete this condition?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/health/chronic-conditions/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setChronicConditions((p) => p.filter((c) => c._id !== id));
      setHealthSuccess("Condition deleted");

      // Refresh health summary and activities
      const summaryRes = await axios.get("/api/health/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (summaryRes?.data?.summary) {
        setHealthSummary(summaryRes.data.summary);
      }

      const activitiesRes = await axios.get("/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activitiesRes?.data?.activities) {
        setActivities(activitiesRes.data.activities);
      }

      setTimeout(() => setHealthSuccess(""), 3000);
    } catch (err) {
      setHealthError(err?.response?.data?.message || "Failed to delete");
    }
  };

  const handleAddMedication = async (formData) => {
    try {
      setProcessingHealth(true);
      setHealthError("");
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/health/medications", formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res?.data?.medication) {
        setMedications((p) => [res.data.medication, ...p]);
        setHealthSuccess("Medication added");
        setShowMedicationModal(false);
        
        // Refresh health summary and activities
        const summaryRes = await axios.get("/api/health/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (summaryRes?.data?.summary) {
          setHealthSummary(summaryRes.data.summary);
        }

        const activitiesRes = await axios.get("/api/activities", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (activitiesRes?.data?.activities) {
          setActivities(activitiesRes.data.activities);
        }

        setTimeout(() => setHealthSuccess(""), 3000);
      }
    } catch (err) {
      setHealthError(err?.response?.data?.message || "Failed to add medication");
    } finally {
      setProcessingHealth(false);
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medication?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/health/medications/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setMedications((p) => p.filter((m) => m._id !== id));
      setHealthSuccess("Medication deleted");

      // Refresh health summary and activities
      const summaryRes = await axios.get("/api/health/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (summaryRes?.data?.summary) {
        setHealthSummary(summaryRes.data.summary);
      }

      const activitiesRes = await axios.get("/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activitiesRes?.data?.activities) {
        setActivities(activitiesRes.data.activities);
      }

      setTimeout(() => setHealthSuccess(""), 3000);
    } catch (err) {
      setHealthError(err?.response?.data?.message || "Failed to delete");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "mild":
        return "bg-green-100 text-green-700 border-green-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "severe":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case "once-daily":
        return "Once Daily";
      case "twice-daily":
        return "Twice Daily";
      case "three-times-daily":
        return "Three Times Daily";
      case "as-needed":
        return "As Needed";
      default:
        return frequency;
    }
  };

  // Filter and search reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch = searchQuery
      ? (report.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.url?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesCategory =
      categoryFilter === "All" || report.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "All",
    "Lab Results",
    "Prescription",
    "X-Ray",
    "CT Scan",
    "MRI",
    "Ultrasound",
    "Blood Test",
    "Doctor's Note",
    "Insurance",
    "Other",
  ];

  const getActivityIcon = (action) => {
    switch (action) {
      case "uploaded_report":
        return <FileText className="w-4 h-4" />;
      case "deleted_report":
        return <X className="w-4 h-4" />;
      case "added_condition":
      case "added_medication":
        return <Pill className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (action) => {
    if (action.includes("added") || action.includes("uploaded")) {
      return "text-green-600 bg-green-50";
    }
    if (action.includes("deleted") || action.includes("removed")) {
      return "text-red-600 bg-red-50";
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ============ BACK TO DASHBOARD BUTTON ============ */}
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* ============ NEW: HEALTH SUMMARY DASHBOARD ============ */}
        {healthSummary && (
          <div className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Health Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{healthSummary.chronicConditionsCount}</div>
                <div className="text-sm text-white/80 mt-1">Chronic Conditions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{healthSummary.medicationsCount}</div>
                <div className="text-sm text-white/80 mt-1">Medications</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">{healthSummary.medicalReportsCount}</div>
                <div className="text-sm text-white/80 mt-1">Medical Reports</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-sm text-white/80 mb-1">Last Report</div>
                <div className="text-lg font-semibold">
                  {healthSummary.lastReportDate
                    ? new Date(healthSummary.lastReportDate).toLocaleDateString()
                    : "None"}
                </div>
                {healthSummary.lastReportCategory && (
                  <div className="text-xs text-white/70 mt-1">{healthSummary.lastReportCategory}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ NEW: CHRONIC CONDITIONS & MEDICATIONS SECTION ============ */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chronic Conditions Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Chronic Conditions
                </h2>
              </div>
              <button
                onClick={() => setShowConditionModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chronicConditions.length === 0 ? (
                <p className="text-gray-400 text-sm italic text-center py-8">
                  No conditions added yet.
                </p>
              ) : (
                chronicConditions.map((condition) => (
                  <div
                    key={condition._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {condition.conditionName}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(
                            condition.severityLevel
                          )}`}
                        >
                          {condition.severityLevel.charAt(0).toUpperCase() +
                            condition.severityLevel.slice(1)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCondition(condition._id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Medications Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-orange-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Current Medications
                </h2>
              </div>
              <button
                onClick={() => setShowMedicationModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {medications.length === 0 ? (
                <p className="text-gray-400 text-sm italic text-center py-8">
                  No medications added yet.
                </p>
              ) : (
                medications.map((medication) => (
                  <div
                    key={medication._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {medication.medicationName}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {medication.dosage} •{" "}
                        {getFrequencyLabel(medication.frequency)}
                        {medication.times && medication.times.length > 0 && (
                          <span className="ml-1">
                            • {medication.times.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMedication(medication._id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Health Messages */}
        {healthError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {healthError}
          </div>
        )}
        {healthSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {healthSuccess}
          </div>
        )}

        {/* ============ NEW: ACTIVITY TIMELINE ============ */}
        {activities.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activities.slice(0, 10).map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ EXISTING MEDICAL REPORTS SECTION (UNCHANGED) ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Profile Activity
            </h2>
            <div className="text-xs text-gray-500">
              Manage your medical documents
            </div>
          </div>

          {/* NEW: Category, Date, Notes fields */}
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={uploadFormData.category}
                onChange={(e) =>
                  setUploadFormData({ ...uploadFormData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm"
              >
                <option value="Lab Results">Lab Results</option>
                <option value="Prescription">Prescription</option>
                <option value="X-Ray">X-Ray</option>
                <option value="CT Scan">CT Scan</option>
                <option value="MRI">MRI</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="Blood Test">Blood Test</option>
                <option value="Doctor's Note">Doctor's Note</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Date (Optional)
              </label>
              <input
                type="date"
                value={uploadFormData.reportDate}
                onChange={(e) =>
                  setUploadFormData({ ...uploadFormData, reportDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={uploadFormData.notes}
                onChange={(e) =>
                  setUploadFormData({ ...uploadFormData, notes: e.target.value })
                }
                placeholder="Add any notes about this report..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm resize-none"
                rows="2"
                maxLength="500"
              />
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) {
                const mockEv = { target: { files: [dropped] } };
                handleFileChange(mockEv);
              }
            }}
            className={`w-full rounded-lg border-2 ${
              dragActive
                ? "border-pink-400 bg-pink-50"
                : "border-dashed border-gray-200 bg-gray-50"
            } p-4 flex flex-col items-center justify-center transition-colors`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-pink-500 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16v-4a4 4 0 114 4h-1v4h4v-4h-1a4 4 0 114-4v4"
              />
            </svg>
            <div className="text-sm text-gray-700 mb-2">
              Drag & drop a file here, or
            </div>

            <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50">
              Choose a file
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="mt-3 w-full">
              {renderPreview()}

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              {success && (
                <p className="text-green-600 text-sm mt-2">{success}</p>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 w-full py-2 rounded-lg text-white font-semibold disabled:opacity-60 bg-gradient-to-r from-pink-500 to-purple-500 shadow"
              >
                {uploading ? `Uploading ${uploadProgress}%` : "Upload File"}
              </button>

              {uploadProgress > 0 && (
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-400">
            Supported: PNG, JPG, JPEG, PDF • Max size: depends on server
            settings
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-900">
              Your Documents
            </h3>
            <div className="text-xs text-gray-500">
              {filteredReports.length} file{filteredReports.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* NEW: Search and Filter */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm appearance-none bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3"
                />
              </svg>
              <div className="text-sm text-gray-500">
                {searchQuery || categoryFilter !== "All"
                  ? "No matching documents found."
                  : "No documents uploaded yet. Upload to see them here."}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredReports.map((r) => {
                const name = r.url.split("/").pop();
                const isImage = /\.(jpg|jpeg|png)$/i.test(name);
                const id = r._id || r.id || r.url;
                const deleting = deletingIds.includes(id);
                return (
                  <div
                    key={id}
                    className="group relative block p-3 rounded-lg border border-gray-100 hover:shadow-lg transition-shadow bg-white"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                        {isImage ? (
                          <img
                            src={r.url}
                            alt={name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openPreview(r)}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-pink-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {name}
                        </div>
                        {/* NEW: Show category */}
                        {r.category && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                              {r.category}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {r.reportDate
                            ? new Date(r.reportDate).toLocaleDateString()
                            : new Date(r.createdAt || r.created_at || Date.now()).toLocaleDateString()}
                        </div>
                        {/* NEW: Show notes preview */}
                        {r.notes && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {r.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openPreview(r)}
                          className="text-pink-500 text-sm"
                        >
                          View
                        </button>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-pink-500 text-sm"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => handleRemove(id)}
                          disabled={deleting}
                          className={`text-sm ${
                            deleting
                              ? "text-gray-400"
                              : "text-red-500 hover:text-red-600"
                          }`}
                        >
                          {deleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

{/* ============ ENHANCED PREVIEW MODAL ============ */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={closePreview}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedReport.url.split("/").pop()}
                  </div>
                  {selectedReport.category && (
                    <span className="inline-block px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded-full">
                      {selectedReport.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {(selectedReport.reportDate || selectedReport.notes) && (
                <div className="mt-3 space-y-2 text-sm">
                  {selectedReport.reportDate && (
                    <div className="text-gray-600">
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(selectedReport.reportDate).toLocaleDateString()}
                    </div>
                  )}
                  {selectedReport.notes && (
                    <div className="text-gray-600">
                      <span className="font-medium">Notes:</span> {selectedReport.notes}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-3 mt-3">
                <a
                  href={selectedReport.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm font-medium"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() =>
                    handleRemove(
                      selectedReport._id ||
                        selectedReport.id ||
                        selectedReport.url
                    )
                  }
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center bg-gray-50">
              {/\.(jpg|jpeg|png)$/i.test(
                selectedReport.url.split("/").pop()
              ) ? (
                <img
                  src={selectedReport.url}
                  alt={selectedReport.url.split("/").pop()}
                  className="max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <iframe
                  src={selectedReport.url}
                  title="document preview"
                  className="w-full h-[70vh] rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <AddConditionModal
        isOpen={showConditionModal}
        onClose={() => setShowConditionModal(false)}
        onSave={handleAddCondition}
        isProcessing={processingHealth}
      />
      
      <AddMedicationModal
        isOpen={showMedicationModal}
        onClose={() => setShowMedicationModal(false)}
        onSave={handleAddMedication}
        isProcessing={processingHealth}
      /> 
      </div>
    </div>
  );
};

export default ProfileActivity;
