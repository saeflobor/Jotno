import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const ConfirmationModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Yes, Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white"
          >
            {/* Header */}
            <div
              className={`p-6 border-b ${
                isDangerous
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`text-3xl ${
                      isDangerous ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {isDangerous ? "⚠️" : "❓"}
                  </div>
                  <h2
                    className={`text-lg font-bold ${
                      isDangerous
                        ? "text-red-900"
                        : "text-blue-900"
                    }`}
                  >
                    {title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-base leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
                  isDangerous
                    ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                    : "bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/80 active:bg-[rgb(211,46,149)]/90"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
