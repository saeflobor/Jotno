import React, { useState } from "react";
import { Pill, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const DEFAULT_REMINDER_TIMES = {
  "once-daily": ["12:00"],
  "twice-daily": ["10:00", "22:00"],
  "three-times-daily": ["08:00", "15:00", "22:00"],
};

const AddMedicationModal = ({ isOpen, onClose, onSave, isProcessing }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    medicationName: "",
    dosage: "",
    duration: "",
    frequency: "once-daily",
    times: [""],
    notificationType: "me",
  });

  if (!isOpen) return null;

  const getResolvedTimes = (frequency, times) => {
    const cleanedTimes = (Array.isArray(times) ? times : [times])
      .map((time) => (typeof time === "string" ? time.trim() : ""))
      .filter(Boolean);

    if (cleanedTimes.length > 0) return cleanedTimes;

    return DEFAULT_REMINDER_TIMES[frequency] || [];
  };

  const handleSubmit = () => {
    // Basic validation
    if (!form.medicationName.trim() || !form.dosage.trim() || !form.duration.trim()) {
      alert(t('addMedication.validation'));
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
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('addMedication.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('addMedication.nameLabel')}
            </label>
            <input
              type="text"
              placeholder={t('addMedication.namePlaceholder')}
              value={form.medicationName}
              onChange={(e) =>
                setForm({ ...form, medicationName: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('addMedication.dosageLabel')}
              </label>
              <input
                type="text"
                placeholder={t('addMedication.dosagePlaceholder')}
                value={form.dosage}
                onChange={(e) =>
                  setForm({ ...form, dosage: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('addMedication.frequencyLabel')}
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
                <option value="once-daily">{t('addMedication.onceDaily')}</option>
                <option value="twice-daily">{t('addMedication.twiceDaily')}</option>
                <option value="three-times-daily">{t('addMedication.threeTimesDaily')}</option>
                <option value="as-needed">{t('addMedication.asNeeded')}</option>
              </select>
            </div>
          </div>

          {form.times && form.times.length > 0 && (
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('addMedication.scheduleLabel')}
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
              {t('addMedication.durationLabel')}
            </label>
            <input
              type="number"
              placeholder={t('addMedication.durationPlaceholder')}
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('addMedication.receiverLabel')}
            </label>
            <select
              value={form.notificationType}
              onChange={(e) =>
                setForm({ ...form, notificationType: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 bg-white"
            >
              <option value="me">{t('addMedication.onlyMe')}</option>
              <option value="family">{t('addMedication.meAndFamily')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30 transition-all"
            >
              {isProcessing ? t('addMedication.adding') : t('addMedication.addBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMedicationModal;
