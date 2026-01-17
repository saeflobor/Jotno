import React, { useState, useEffect } from "react";
import axios from "axios";

const ProfileActivity = ({ user, setUser }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
    </div>
  );
};

export default ProfileActivity;
