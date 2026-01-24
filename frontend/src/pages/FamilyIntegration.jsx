import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FamilyRequestNotifications from "../components/FamilyRequestNotifications";
import FamilyMemberSection from "../components/FamilyMemberSection";
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
  const [memberPhone, setMemberPhone] = useState("");
  const [identifierType, setIdentifierType] = useState("email");
  const [toast, setToast] = useState({ type: "", text: "" });
  const [showNotifications, setShowNotifications] = useState(false);

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

  const resetForm = () => {
    setMemberEmail("");
    setMemberPhone("");
    setRelationKey("father");
    setIdentifierType("email");
  };

  const handleSendRequest = async () => {
    const trimmedEmail = memberEmail.trim();
    const trimmedPhone = memberPhone.trim();

    if (!trimmedEmail) {
      return showToast("error", "Please enter an email");
    }
    if (!trimmedPhone) {
      return showToast("error", "Please enter a phone number");
    }

    const payload = { relation: relationMap[relationKey] };
    if (identifierType === "email" && trimmedEmail) {
      payload.memberEmail = trimmedEmail;
    } else if (identifierType === "phone" && trimmedPhone) {
      payload.memberPhone = trimmedPhone;
    }

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
    if (!window.confirm("Are you sure?")) return;
    const result = await removeFamily(memberId, relationType);
    if (result.success) {
      setUser(result.user);
      showToast("success", "Member removed");
    } else {
      showToast("error", result.message);
    }
  };

  return (
    <div className="min-h-screen py-8 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Dashboard /{" "}
            <span className="text-gray-900 font-semibold">
              Family Management
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              🔔 Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Notifications Panel */}
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
        <div className="mx-4 md:mx-6 p-5 rounded-2xl bg-white shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">
                Send Family Request
              </div>
              <div className="text-sm text-gray-600">
                Send a request to add a family member. They will need to accept.
              </div>
            </div>
            <Pill className="text-gray-700 bg-gray-100 border border-gray-200">
              Request System
            </Pill>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
            <select
              value={relationKey}
              onChange={(e) => setRelationKey(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 text-gray-900 bg-white"
            >
              {RELATIONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>

            <select
              value={identifierType}
              onChange={(e) => setIdentifierType(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 text-gray-900 bg-white"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>

            {identifierType === "email" ? (
              <input
                type="email"
                placeholder="family@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
              />
            ) : (
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSendRequest}
                disabled={processing}
                className="flex-1 py-3 rounded-lg font-semibold bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/80 text-white disabled:opacity-50"
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

          {/* Toast Notification */}
          <AnimatePresence>
            {toast.text && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mt-3 p-3 rounded-md ${
                  toast.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {toast.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Family Members Grid */}
          <motion.div
            layout
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min"
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

            {/* Children Section */}
            <div className="lg:col-span-3 min-h-[180px]">
              <div className="text-xs text-gray-600 font-semibold mb-2">
                Children
              </div>
              <div className="flex flex-wrap gap-4">
                <AnimatePresence>
                  {Array.isArray(family.children) && family.children.length > 0 ? (
                    family.children.map((child) => (
                      <div key={child._id} className="w-full sm:w-auto">
                        <FamilyMemberSection
                          title=""
                          member={child}
                          onRemove={handleRemove}
                          relationType="child"
                        />
                      </div>
                    ))
                  ) : (
                    <motion.div
                      layout
                      key="no-children"
                      className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 w-full h-[180px] flex items-center justify-center"
                    >
                      No children
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FamilyIntegration;
