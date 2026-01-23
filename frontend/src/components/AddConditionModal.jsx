import React, { useState } from "react";
import { Pill, X } from "lucide-react";

const AddConditionModal = ({ isOpen, onClose, onSave, isProcessing }) => {
  const [form, setForm] = useState({
    conditionName: "",
    severityLevel: "mild",
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!form.conditionName.trim()) {
      alert("Please enter a condition name");
      return;
    }
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
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
            onClick={onClose}
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
              value={form.conditionName}
              onChange={(e) =>
                setForm({ ...form, conditionName: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Severity Level
            </label>
            <select
              value={form.severityLevel}
              onChange={(e) =>
                setForm({ ...form, severityLevel: e.target.value })
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
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 transition-all"
            >
              {isProcessing ? "Adding..." : "Add Condition"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddConditionModal;
