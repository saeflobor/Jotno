import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import {
  FileText,
  Upload,
  Sparkles,
  AlertTriangle,
  X,
  Check,
  ArrowLeft,
  Pill,
  Trash2,
  Edit3,
  Save,
} from "lucide-react";

const ExtractPrescription = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [medications, setMedications] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  const frequencyLabels = {
    "once-daily": t("extractPrescription.onceDaily"),
    "twice-daily": t("extractPrescription.twiceDaily"),
    "three-times-daily": t("extractPrescription.threeTimesDaily"),
    "as-needed": t("extractPrescription.asNeeded"),
  };

  const DEFAULT_REMINDER_TIMES = {
    "once-daily": ["12:00"],
    "twice-daily": ["10:00", "22:00"],
    "three-times-daily": ["08:00", "15:00", "22:00"],
    "as-needed": [],
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected) => {
    if (selected.mimetype !== "application/pdf" && selected.type !== "application/pdf") {
      setError(t("extractPrescription.onlyPdf"));
      return;
    }
    setFile(selected);
    setError("");
    setMedications([]);
    setMetadata(null);
    setSuccess("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const handleExtract = async () => {
    if (!file) {
      setError(t("extractPrescription.selectFile"));
      return;
    }

    setExtracting(true);
    setError("");
    setSuccess("");
    setMedications([]);
    setMetadata(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("/api/ai/extract-prescription", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 150000,
      });

      if (res.data?.medications) {
        setMedications(res.data.medications);
        setMetadata(res.data.metadata || null);
        if (res.data.medications.length === 0) {
          setError(t("extractPrescription.noMedsFound"));
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("extractPrescription.extractFailed")
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveMed = (index) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditMed = (index) => {
    setEditingIndex(index);
    setEditForm({ ...medications[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    setMedications((prev) =>
      prev.map((med, i) => (i === editingIndex ? { ...editForm } : med))
    );
    setEditingIndex(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  const handleSaveAll = async () => {
    if (medications.length === 0) return;
    setSaving(true);
    setError("");
    setSuccess("");

    let savedCount = 0;
    const errors = [];

    for (const med of medications) {
      try {
        const times = DEFAULT_REMINDER_TIMES[med.frequency] || [];
        await axios.post("/api/health/medications", {
          medicationName: med.medicationName,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          times,
          notificationType: "me",
        });
        savedCount++;
      } catch (err) {
        errors.push(
          `${med.medicationName}: ${err?.response?.data?.message || "Failed"}`
        );
      }
    }

    setSaving(false);

    if (savedCount > 0) {
      setSuccess(
        t("extractPrescription.savedSuccess", { count: savedCount })
      );
      setMedications([]);
      setFile(null);
      setMetadata(null);
    }

    if (errors.length > 0) {
      setError(errors.join("; "));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/profile-activity")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("extractPrescription.back")}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("extractPrescription.title")}
              </h1>
              <p className="text-sm text-gray-500">
                {t("extractPrescription.subtitle")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3"
            >
              <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-emerald-700 text-sm flex-1">{success}</p>
              <button
                onClick={() => setSuccess("")}
                className="text-emerald-400 hover:text-emerald-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6"
        >
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? "border-purple-400 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-sm mb-2">
              {t("extractPrescription.dragDrop")}
            </p>
            <label className="inline-block cursor-pointer text-purple-600 hover:text-purple-700 font-medium text-sm underline">
              {t("extractPrescription.chooseFile")}
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">
              {t("extractPrescription.pdfOnly")}
            </p>
          </div>

          {/* Selected file display */}
          {file && (
            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-700 truncate max-w-xs">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setMedications([]);
                  setMetadata(null);
                }}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Extract button */}
          <button
            onClick={handleExtract}
            disabled={!file || extracting}
            className="mt-4 w-full px-5 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {extracting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("extractPrescription.extracting")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t("extractPrescription.extractBtn")}
              </>
            )}
          </button>
        </motion.div>

        {/* Loading state */}
        {extracting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-6"
          >
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 font-medium">
                {t("extractPrescription.analyzing")}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t("extractPrescription.mayTakeMoment")}
              </p>
            </div>
          </motion.div>
        )}

        {/* Results section */}
        <AnimatePresence>
          {medications.length > 0 && !extracting && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {t("extractPrescription.extractedMeds")}
                      </h2>
                      <p className="text-xs text-gray-400">
                        {t("extractPrescription.foundCount", {
                          count: medications.length,
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("extractPrescription.saving")}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t("extractPrescription.saveAll")}
                      </>
                    )}
                  </button>
                </div>

                {/* Medications list */}
                <div className="space-y-3">
                  {medications.map((med, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      {editingIndex === idx ? (
                        /* Edit mode */
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editForm.medicationName}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                medicationName: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            placeholder={t("extractPrescription.medName")}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editForm.dosage}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  dosage: e.target.value,
                                })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                              placeholder={t("extractPrescription.dosage")}
                            />
                            <select
                              value={editForm.frequency}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  frequency: e.target.value,
                                })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            >
                              <option value="once-daily">
                                {t("extractPrescription.onceDaily")}
                              </option>
                              <option value="twice-daily">
                                {t("extractPrescription.twiceDaily")}
                              </option>
                              <option value="three-times-daily">
                                {t("extractPrescription.threeTimesDaily")}
                              </option>
                              <option value="as-needed">
                                {t("extractPrescription.asNeeded")}
                              </option>
                            </select>
                            <input
                              type="number"
                              value={editForm.duration}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  duration: parseInt(e.target.value) || 0,
                                })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                              placeholder={t("extractPrescription.days")}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition"
                            >
                              {t("cancel")}
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                              {t("save")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display mode */
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {med.medicationName}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {med.dosage}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                {frequencyLabels[med.frequency] || med.frequency}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                {med.duration} {t("extractPrescription.days")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-3">
                            <button
                              onClick={() => handleEditMed(idx)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title={t("extractPrescription.edit")}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMed(idx)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title={t("extractPrescription.remove")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Metadata */}
                {metadata && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {t("extractPrescription.model")}: {metadata.model}
                    </span>
                    <span>
                      {metadata.pdfPages} {t("extractPrescription.pages")}
                    </span>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">
                      {t("extractPrescription.disclaimerTitle")}
                    </span>{" "}
                    {t("extractPrescription.disclaimerText")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state after extraction with no results */}
        {!extracting && medications.length === 0 && metadata && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {t("extractPrescription.noMedsFound")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractPrescription;
