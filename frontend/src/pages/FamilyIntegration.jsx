import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FamilyRequestNotifications from "../components/FamilyRequestNotifications";
import FamilyMemberSection from "../components/FamilyMemberSection";
import ConfirmationModal from "../components/ConfirmationModal";
import { useFamilyRequests } from "../hooks/useFamilyRequests";

const RELATIONS = [
  { key: "father", label: "Father", api: "father" },
  { key: "mother", label: "Mother", api: "mother" },
  { key: "spouse", label: "Spouse", api: "spouse" },
  { key: "son", label: "Son", api: "child" },
  { key: "daughter", label: "Daughter", api: "child" },
];

const Pill = ({ children, className = "" }) => (
  <div
    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${className}`}
  >
    {children}
  </div>
);

const FamilyIntegration = ({ user, setUser }) => {
  const navigate = useNavigate();
  const family = user?.family || {};

  const [relationKey, setRelationKey] = useState("father");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("+88");
  const [toast, setToast] = useState({ type: "", text: "" });
  const [showNotifications, setShowNotifications] = useState(false);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    isDangerous: false,
    onConfirm: null,
  });

  useEffect(() => {
    const syncFamilyData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await axios.get("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        }
      } catch (err) {
        console.error("Failed to sync family data:", err);
      }
    };
    syncFamilyData();
  }, [setUser]);

  const {
    pendingRequests,
    sentRequests,
    processing,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFamily,
  } = useFamilyRequests();

  const relationMap = useMemo(() => {
    const m = {};
    RELATIONS.forEach((r) => (m[r.key] = r.api));
    return m;
  }, []);

  const showToast = (type, text, time = 3500) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), time);
  };

  const getFirstAvailableRelation = () => {
    const found = RELATIONS.find((r) => {
      const isTaken =
        (r.api === "father" && family.father) ||
        (r.api === "mother" && family.mother) ||
        (r.api === "spouse" && family.spouse);
      const hasPending = sentRequests.some(
        (req) => req.relation === r.api && ["father", "mother"].includes(r.api),
      );
      return !isTaken && !hasPending;
    });
    return found ? found.key : "son";
  };

  const resetForm = () => {
    setMemberEmail("");
    setMemberPhone("+88");
    setRelationKey(getFirstAvailableRelation());
  };

  // Switch relation if current one becomes unavailable
  useEffect(() => {
    const isCurrentTaken =
      (relationKey === "father" && family.father) ||
      (relationKey === "mother" && family.mother) ||
      (relationKey === "spouse" && family.spouse);
    const isCurrentPending = sentRequests.some(
      (req) => req.relation === relationMap[relationKey] && ["father", "mother"].includes(relationMap[relationKey]),
    );

    if (isCurrentTaken || isCurrentPending) {
      setRelationKey(getFirstAvailableRelation());
    }
  }, [family, sentRequests, relationKey, relationMap]);

  // Keep +88 prefix enforced on phone input
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (!value.startsWith("+88")) {
      setMemberPhone("+88");
      return;
    }

    const afterPrefix = value.slice(3);
    if (!/^\d*$/.test(afterPrefix)) return;
    if (value.length > 14) return; // +88 plus up to 11 digits

    setMemberPhone(value);
  };

  // 🔥 SEND BOTH EMAIL + PHONE (STRICT MODE)
  const handleSendRequest = async () => {
    const trimmedEmail = memberEmail.trim();
    const trimmedPhone = memberPhone.trim();

    if (!trimmedEmail) {
      return showToast("error", "Email is required");
    }

    if (!trimmedPhone || trimmedPhone === "+88") {
      return showToast("error", "Phone number is required");
    }

    const relationApi = relationMap[relationKey];

    // Check if relation is already filled
    if (relationApi === "father" && family.father) {
      return showToast("error", "You already have a father added");
    }
    if (relationApi === "mother" && family.mother) {
      return showToast("error", "You already have a mother added");
    }
    if (relationApi === "spouse" && family.spouse) {
      return showToast("error", "You already have a spouse added");
    }

    // Check if there is already a pending request for Father or Mother
    const hasPendingRoleRequest = sentRequests.some(
      (r) => r.relation === relationApi,
    );
    if (
      ["father", "mother"].includes(relationApi) &&
      hasPendingRoleRequest
    ) {
      return showToast(
        "error",
        `You already have a pending request for a ${relationApi}`,
      );
    }

    const payload = {
      memberEmail: trimmedEmail,
      memberPhone: trimmedPhone,
      relation: relationApi,
    };

    const result = await sendRequest(payload);

    showToast(result.success ? "success" : "error", result.message);

    if (result.success) resetForm();
  };

  const handleAcceptRequest = async (requestId) => {
    const result = await acceptRequest(requestId);
    if (result.success) {
      setUser(result.user);
      showToast("success", "Family request accepted!");
    } else {
      showToast("error", result.message);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    const result = await declineRequest(requestId);
    showToast(result.success ? "success" : "error", result.message);
  };

  const handleCancelRequest = async (requestId) => {
    const result = await cancelRequest(requestId);
    showToast(result.success ? "success" : "error", result.message);
  };

  const handleRemove = async (memberId, relationType) => {
    setConfirmation({
      isOpen: true,
      title: "Remove Family Member",
      message: "Are you sure you want to remove this family member? This action cannot be undone.",
      isDangerous: true,
      confirmText: "Remove",
      onConfirm: async () => {
        const result = await removeFamily(memberId, relationType);
        if (result.success) {
          setUser(result.user);
          showToast("success", "Member removed");
        } else {
          showToast("error", result.message);
        }
        setConfirmation({ ...confirmation, isOpen: false });
      },
    });
  };

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1 sm:flex-1">
            Dashboard /{" "}
            <span className="text-gray-900 font-semibold">
              Family Management
            </span>
          </div>
          <div className="flex justify-center order-1 sm:order-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative px-3 sm:px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm sm:text-base"
            >
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex justify-end order-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 sm:gap-2 text-[rgb(211,46,149)] hover:text-[rgb(190,35,130)] transition font-semibold text-sm sm:text-base"
            >
              <span className="text-lg">←</span>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FamilyRequestNotifications
                pendingRequests={pendingRequests}
                sentRequests={sentRequests}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
                onCancel={handleCancelRequest}
                processing={processing}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send Request Form */}
        <div className="mx-0 sm:mx-4 md:mx-6 p-4 sm:p-5 rounded-2xl bg-white shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">
                Send Family Request
              </div>
              <div className="text-sm text-gray-600">
                Send a request to add as a family member. They will need to accept.
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
            <select
              value={relationKey}
              onChange={(e) => setRelationKey(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 text-gray-900 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition"
            >
              {RELATIONS.map((r) => {
                const isTaken =
                  (r.api === "father" && family.father) ||
                  (r.api === "mother" && family.mother) ||
                  (r.api === "spouse" && family.spouse);
                const hasPending = sentRequests.some(
                  (req) => req.relation === r.api,
                );
                const isDisabled = isTaken || (hasPending && ["father", "mother"].includes(r.api));

                return (
                  <option key={r.key} value={r.key} disabled={isDisabled}>
                    {r.label}{" "}
                    {isTaken
                      ? "(Already Added)"
                      : hasPending
                        ? ["father", "mother"].includes(r.api)
                          ? "(Pending Request Sent)"
                          : "(Request Already Sent)"
                        : ""}
                  </option>
                );
              })}
            </select>

            <input
              type="email"
              placeholder="family@example.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900"
            />

            <input
              type="tel"
              placeholder="+8801xxxxxxxxx"
              value={memberPhone}
              onChange={handlePhoneChange}
              className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSendRequest}
                disabled={processing}
                className="flex-1 py-3 rounded-lg font-semibold bg-[rgb(211,46,149)] text-white hover:bg-[rgb(211,46,149)]/80 disabled:opacity-50"
              >
                {processing ? "Sending..." : "Send Request"}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Floating Toast Notification */}
          <AnimatePresence>
            {toast.text && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-50 sm:w-80 p-4 rounded-xl shadow-lg ${
                  toast.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${
                    toast.type === "success" ? "text-green-600" : "text-red-600"
                  }`}>
                    {toast.type === "success" ? "✔" : "⚠"}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      toast.type === "success" ? "text-green-800" : "text-red-800"
                    }`}>
                      {toast.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToast({ type: "", text: "" })}
                    className={toast.type === "success" ? "text-green-700 hover:text-green-900" : "text-red-700 hover:text-red-900"}
                    aria-label="Dismiss notification"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Family Members */}
          <motion.div
            layout
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <FamilyMemberSection
              title="Father"
              member={family.father}
              onRemove={handleRemove}
              relationType="father"
            />

            <FamilyMemberSection
              title="Mother"
              member={family.mother}
              onRemove={handleRemove}
              relationType="mother"
            />

            <FamilyMemberSection
              title="Spouse"
              member={family.spouse}
              onRemove={handleRemove}
              relationType="spouse"
            />

            <div className="lg:col-span-3">
              <div className="text-xs text-gray-600 font-semibold mb-2">
                Children
              </div>
              <div className="flex flex-wrap gap-4">
                <AnimatePresence>
                  {Array.isArray(family.children) &&
                  family.children.length > 0 ? (
                    family.children.map((child) => (
                      <FamilyMemberSection
                        key={child._id}
                        title=""
                        member={child}
                        onRemove={handleRemove}
                        relationType="child"
                      />
                    ))
                  ) : (
                    <motion.div className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 w-full h-[160px] flex items-center justify-center">
                      No children
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          isDangerous={confirmation.isDangerous}
          confirmText={confirmation.confirmText || "Confirm"}
          onConfirm={() => {
            if (confirmation.onConfirm) {
              confirmation.onConfirm();
            }
            setConfirmation({ ...confirmation, isOpen: false });
          }}
          onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
        />
      </div>
    </div>
  );
};

export default FamilyIntegration;
