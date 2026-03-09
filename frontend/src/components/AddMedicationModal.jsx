import React, { useState, useEffect, useRef } from "react";
import {
  Pill,
  X,
  Loader,
  CheckCircle2,
  Building2,
  Zap,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "../lib/axios";

const DEFAULT_REMINDER_TIMES = {
  "once-daily": ["12:00"],
  "twice-daily": ["10:00", "22:00"],
  "three-times-daily": ["08:00", "15:00", "22:00"],
};

const AddMedicationModal = ({
  isOpen,
  onClose,
  onSave,
  isProcessing,
  editingMedication,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    medicationName: "",
    dosage: "",
    volume: "",
    duration: "",
    frequency: "once-daily",
    times: [""],
    notificationType: "me",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const debounceRef = useRef(null);
  const isSelectingRef = useRef(false);

  // Populate form when editing an existing medication
  useEffect(() => {
    if (editingMedication) {
      setForm({
        medicationName: editingMedication.medicationName || "",
        dosage: editingMedication.dosage || "",
        volume: editingMedication.volume || "",
        duration: String(editingMedication.duration || ""),
        frequency: editingMedication.frequency || "once-daily",
        times:
          editingMedication.times && editingMedication.times.length > 0
            ? editingMedication.times
            : [""],
        notificationType: editingMedication.notificationType || "me",
      });
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      // Reset form when not editing
      setForm({
        medicationName: "",
        dosage: "",
        volume: "",
        duration: "",
        frequency: "once-daily",
        times: [""],
        notificationType: "me",
      });
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchCompleted(false);
    }
  }, [editingMedication, isOpen]);

  // Debounced medicine search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const searchTerm = form.medicationName.trim();

    if (searchTerm.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchCompleted(false);
      return;
    }

    // Skip search if we just selected a medicine
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    setLoadingSuggestions(true);
    setSearchCompleted(false);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await axios.get("/api/medicines", {
          params: { q: searchTerm, limit: 8 },
        });

        if (response.data.success && response.data.data) {
          setSuggestions(response.data.data);
          setShowSuggestions(true);
          setSearchCompleted(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
          setSearchCompleted(true);
        }
      } catch (error) {
        console.error("Failed to fetch medicine suggestions:", error);
        setSuggestions([]);
        setSearchCompleted(true);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.medicationName]);

  if (!isOpen) return null;

  const handleSelectMedicine = (medicine) => {
    isSelectingRef.current = true;
    const displayName = `${medicine.brand_name}${medicine.generic ? ` (${medicine.generic})` : ""}`;
    setForm({ ...form, medicationName: displayName });
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchCompleted(false);
  };

  const getResolvedTimes = (frequency, times) => {
    const cleanedTimes = (Array.isArray(times) ? times : [times])
      .map((time) => (typeof time === "string" ? time.trim() : ""))
      .filter(Boolean);

    if (cleanedTimes.length > 0) return cleanedTimes;

    return DEFAULT_REMINDER_TIMES[frequency] || [];
  };

  const handleSubmit = () => {
    // Basic validation - only require medication name and duration
    const medicationName = form.medicationName.trim();
    const duration = String(form.duration).trim();

    if (!medicationName || !duration) {
      alert(t("addMedication.validation"));
      return;
    }

    const resolvedTimes = getResolvedTimes(form.frequency, form.times);
    const isCustomSchedule = form.frequency === "as-needed";
    if (isCustomSchedule && resolvedTimes.length === 0) {
      alert("For custom schedule, please specify at least one reminder time.");
      return;
    }

    onSave({ ...form, times: resolvedTimes });
    // Reset handled by parent or manual reset here if needed
    // setForm({...}) usually after success
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/20 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-8 shadow-2xl transform transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              {editingMedication
                ? t("addMedication.editTitle") || "Edit Medication"
                : t("addMedication.title")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t("addMedication.nameLabel")}
            </label>

            {/* Futuristic Medicine Input Container */}
            <div className="bg-gradient-to-r from-orange-50 via-blue-50 to-purple-50 border-2 border-gray-200 rounded-2xl p-4 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Main Medicine Name Input */}
                <input
                  type="text"
                  placeholder={t("addMedication.namePlaceholder")}
                  value={form.medicationName}
                  onChange={(e) =>
                    setForm({ ...form, medicationName: e.target.value })
                  }
                  onFocus={() =>
                    form.medicationName.trim().length > 0 &&
                    setShowSuggestions(true)
                  }
                  className="flex-1 min-w-0 bg-transparent outline-none text-gray-900 placeholder-gray-400 font-medium"
                />

                {/* Inline Dosage Badge */}
                {form.dosage && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-bold shadow-lg">
                    <Zap className="w-3 h-3" />
                    {form.dosage}
                  </div>
                )}

                {/* Inline Volume Badge */}
                {form.volume && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs font-bold shadow-lg">
                    <Building2 className="w-3 h-3" />
                    {form.volume}
                  </div>
                )}
              </div>
            </div>

            {/* Medicine Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl z-50 max-h-80 overflow-hidden border border-gray-100 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-orange-100 px-5 py-3 border-b border-orange-200">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-semibold text-orange-900">
                      Recommended Medicines
                    </p>
                    <span className="ml-auto text-xs font-medium text-orange-700 bg-white px-2 py-1 rounded-full">
                      {suggestions.length} found
                    </span>
                  </div>
                </div>

                {/* Suggestions List */}
                <div className="divide-y divide-gray-100">
                  {suggestions.map((medicine, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectMedicine(medicine)}
                      className="w-full px-5 py-4 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-orange-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Brand Name */}
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 text-base truncate group-hover:text-orange-600 transition-colors">
                              {medicine.brand_name}
                            </h4>
                            <CheckCircle2 className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>

                          {/* Generic Name */}
                          {medicine.generic && (
                            <p className="text-sm text-gray-600 mb-2 font-medium">
                              {medicine.generic}
                            </p>
                          )}

                          {/* Details Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {medicine.strength && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                                <Zap className="w-3 h-3" />
                                {medicine.strength}
                              </span>
                            )}

                            {medicine.manufacturer && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                <Building2 className="w-3 h-3" />
                                {medicine.manufacturer}
                              </span>
                            )}

                            {medicine.dosage_form && (
                              <span className="text-xs text-gray-500 font-medium italic">
                                {medicine.dosage_form}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600 text-center">
                    Select a medicine to autofill the field
                  </p>
                </div>
              </div>
            )}

            {loadingSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                <div className="p-8 flex flex-col items-center justify-center">
                  <div className="relative w-12 h-12 mb-3">
                    <Loader className="w-12 h-12 text-orange-500 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Searching medicines...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    We're finding the best matches
                  </p>
                </div>
              </div>
            )}

            {/* Not Found State */}
            {!loadingSuggestions &&
              searchCompleted &&
              suggestions.length === 0 &&
              form.medicationName.trim().length > 0 &&
              showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                  <div className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Couldn't find in database
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      This medicine isn't in our local database
                    </p>
                    <button
                      onClick={() => {
                        // Just dismiss the dropdown, user can still submit
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 group"
                    >
                      <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Add Anyway
                    </button>
                    <p className="text-xs text-gray-500 mt-3 italic">
                      Continue to save this custom medication
                    </p>
                  </div>
                </div>
              )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("addMedication.frequencyLabel")}
            </label>
            <select
              value={form.frequency}
              onChange={(e) => {
                const newFreq = e.target.value;
                let count = 0;
                if (newFreq === "once-daily") count = 1;
                else if (newFreq === "twice-daily") count = 2;
                else if (newFreq === "three-times-daily") count = 3;
                else if (newFreq === "as-needed") count = 1;

                // Resize times array
                const currentTimes = [...(form.times || [])];
                while (currentTimes.length < count) currentTimes.push("");
                const newTimes = currentTimes.slice(0, count);

                setForm({
                  ...form,
                  frequency: newFreq,
                  times: newTimes,
                });
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 bg-white"
            >
              <option value="once-daily">{t("addMedication.onceDaily")}</option>
              <option value="twice-daily">
                {t("addMedication.twiceDaily")}
              </option>
              <option value="three-times-daily">
                {t("addMedication.threeTimesDaily")}
              </option>
              <option value="as-needed">{t("addMedication.asNeeded")}</option>
            </select>
          </div>

          {form.times && form.times.length > 0 && (
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("addMedication.scheduleLabel")}
              </label>
              <div className="grid grid-cols-1 gap-3">
                {form.times.map((time, idx) => (
                  <input
                    key={idx}
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newTimes = [...form.times];
                      newTimes[idx] = e.target.value;
                      setForm({ ...form, times: newTimes });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900"
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("addMedication.durationLabel")}
            </label>
            <input
              type="number"
              placeholder={t("addMedication.durationPlaceholder")}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("addMedication.receiverLabel")}
            </label>
            <select
              value={form.notificationType}
              onChange={(e) =>
                setForm({ ...form, notificationType: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 bg-white"
            >
              <option value="me">{t("addMedication.onlyMe")}</option>
              <option value="family">{t("addMedication.meAndFamily")}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 transition-all"
            >
              {isProcessing
                ? editingMedication
                  ? t("addMedication.updating") || "Updating..."
                  : t("addMedication.adding")
                : editingMedication
                  ? t("addMedication.updateBtn") || "Update"
                  : t("addMedication.addBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMedicationModal;
