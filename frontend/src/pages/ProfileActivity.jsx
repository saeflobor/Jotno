import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pill, X } from "lucide-react";

const ProfileActivity = ({ user, setUser }) => {
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
  const [conditionForm, setConditionForm] = useState({
    conditionName: "",
    severityLevel: "mild",
  });
  const [medicationForm, setMedicationForm] = useState({
    medicationName: "",
    dosage: "",
    frequency: "once-daily",
  });
  const [healthError, setHealthError] = useState("");
  const [healthSuccess, setHealthSuccess] = useState("");
  const [processingHealth, setProcessingHealth] = useState(false);

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

      setSuccess("File uploaded successfully");
      setFile(null);
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
  const handleAddCondition = async () => {
    if (!conditionForm.conditionName.trim()) {
      setHealthError("Please enter a condition name");
      return;
    }

    try {
      setProcessingHealth(true);
      setHealthError("");
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/health/chronic-conditions", conditionForm, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res?.data?.condition) {
        setChronicConditions((p) => [res.data.condition, ...p]);
        setHealthSuccess("Chronic condition added");
        setShowConditionModal(false);
        setConditionForm({ conditionName: "", severityLevel: "mild" });
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
      setTimeout(() => setHealthSuccess(""), 3000);
    } catch (err) {
      setHealthError(err?.response?.data?.message || "Failed to delete");
    }
  };

  const handleAddMedication = async () => {
    if (!medicationForm.medicationName.trim() || !medicationForm.dosage.trim()) {
      setHealthError("Please fill all medication fields");
      return;
    }

    try {
      setProcessingHealth(true);
      setHealthError("");
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/health/medications", medicationForm, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res?.data?.medication) {
        setMedications((p) => [res.data.medication, ...p]);
        setHealthSuccess("Medication added");
        setShowMedicationModal(false);
        setMedicationForm({
          medicationName: "",
          dosage: "",
          frequency: "once-daily",
        });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
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
              {reports.length} file{reports.length !== 1 ? "s" : ""}
            </div>
          </div>

          {reports.length === 0 ? (
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
                No documents uploaded yet. Upload to see them here.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reports.map((r) => {
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
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(
                            r.createdAt || r.created_at || Date.now()
                          ).toLocaleDateString()}
                        </div>
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

        {/* ============ EXISTING PREVIEW MODAL (UNCHANGED) ============ */}
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
            <div className="p-4 flex justify-between items-start border-b">
              <div className="text-sm font-medium text-gray-900 truncate">
                {selectedReport.url.split("/").pop()}
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={selectedReport.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-pink-500"
                >
                  Open
                </a>
                <button
                  onClick={() =>
                    handleRemove(
                      selectedReport._id ||
                        selectedReport.id ||
                        selectedReport.url
                    )
                  }
                  className="text-sm text-red-500"
                >
                  Delete
                </button>
                <button
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center">
              {/\.(jpg|jpeg|png)$/i.test(
                selectedReport.url.split("/").pop()
              ) ? (
                <img
                  src={selectedReport.url}
                  alt={selectedReport.url.split("/").pop()}
                  className="max-h-[70vh] object-contain"
                />
              ) : (
                <iframe
                  src={selectedReport.url}
                  title="document preview"
                  className="w-full h-[70vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ NEW: ADD CONDITION MODAL ============ */}
      {showConditionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm"
          onClick={() => setShowConditionModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Add Chronic Condition
                </h3>
              </div>
              <button
                onClick={() => setShowConditionModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Condition Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Diabetes, Hypertension"
                  value={conditionForm.conditionName}
                  onChange={(e) =>
                    setConditionForm({
                      ...conditionForm,
                      conditionName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Severity Level
                </label>
                <select
                  value={conditionForm.severityLevel}
                  onChange={(e) =>
                    setConditionForm({
                      ...conditionForm,
                      severityLevel: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 bg-white"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowConditionModal(false)}
                  className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCondition}
                  disabled={processingHealth}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 transition-all"
                >
                  {processingHealth ? "Adding..." : "Add Condition"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ NEW: ADD MEDICATION MODAL ============ */}
      {showMedicationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm"
          onClick={() => setShowMedicationModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Add Medication
                </h3>
              </div>
              <button
                onClick={() => setShowMedicationModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Medication Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Metformin, Lisinopril"
                  value={medicationForm.medicationName}
                  onChange={(e) =>
                    setMedicationForm({
                      ...medicationForm,
                      medicationName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 500mg, 10ml"
                    value={medicationForm.dosage}
                    onChange={(e) =>
                      setMedicationForm({
                        ...medicationForm,
                        dosage: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={medicationForm.frequency}
                    onChange={(e) =>
                      setMedicationForm({
                        ...medicationForm,
                        frequency: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 bg-white"
                  >
                    <option value="once-daily">Once Daily</option>
                    <option value="twice-daily">Twice Daily</option>
                    <option value="three-times-daily">Three Times Daily</option>
                    <option value="as-needed">As Needed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowMedicationModal(false)}
                  className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMedication}
                  disabled={processingHealth}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 transition-all"
                >
                  {processingHealth ? "Adding..." : "Add Medication"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProfileActivity;
