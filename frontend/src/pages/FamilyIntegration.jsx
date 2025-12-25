import React, { useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import UserCard from "../components/UserCard";
import { useNavigate } from "react-router-dom";

const RELATIONS = [
  { key: "father", label: "Father", api: "father" },
  { key: "mother", label: "Mother", api: "mother" },
  { key: "brother", label: "Brother", api: "sibling" },
  { key: "sister", label: "Sister", api: "sibling" },
  { key: "son", label: "Son", api: "child" },
  { key: "daughter", label: "Daughter", api: "child" },
];

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const Pill = ({ children, className = "" }) => (
  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
    {children}
  </div>
);

const FamilyIntegration = ({ user, setUser }) => {
  const navigate = useNavigate();
  const family = user?.family || {};
  const [relationKey, setRelationKey] = useState("father");
  const [memberEmail, setMemberEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" });

  const relationMap = useMemo(() => {
    const m = {};
    RELATIONS.forEach((r) => (m[r.key] = r.api));
    return m;
  }, []);

  function showToast(type, text, time = 3500) {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), time);
  }

  const handleAdd = async () => {
    if (!memberEmail) return showToast("error", "Please enter an email");
    setProcessing(true);
    try {
      const res = await axiosInstance.post("/api/family/add", {
        memberEmail,
        relation: relationMap[relationKey],
      });
      setUser(res.data.user);
      setMemberEmail("");
      showToast("success", res.data.message || "Family updated");
    } catch (err) {
      console.error("add err", err?.response?.data || err);
      showToast("error", err.response?.data?.message || "Failed to add member");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async (memberId, relationType) => {
    if (!window.confirm("Are you sure?")) return;
    setProcessing(true);
    try {
      const res = await axiosInstance.post("/api/family/remove", {
        memberId,
        relation: relationType,
      });
      setUser(res.data.user);
      showToast("success", "Member removed");
    } catch (err) {
      console.error("remove err", err?.response?.data || err);
      showToast("error", err.response?.data?.message || "Failed to remove");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-300">
            Dashboard / <span className="text-white">Family Integration</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-lg border border-white/6 text-white">Back to Dashboard</button>
        </div>

        <div className="mx-4 md:mx-6 p-5 rounded-2xl bg-gradient-to-b from-white/4 to-transparent border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">Add Family Member</div>
              <div className="text-sm text-slate-300">Add by email. Relation will be applied bidirectionally.</div>
            </div>
            <div className="flex gap-2">
              <Pill className="text-slate-200">Tip</Pill>
            </div>
          </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <select value={relationKey} onChange={e => setRelationKey(e.target.value)} className="p-3 rounded-lg border border-white/6 text-white bg-transparent">
          {RELATIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>

        <input type="email" placeholder="family@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} className="p-3 rounded-lg border border-white/6 bg-transparent text-white col-span-1 sm:col-span-1" />

        <div className="flex gap-2">
          <button onClick={handleAdd} disabled={processing} className="flex-1 py-3 rounded-lg font-semibold" style={{ background: "linear-gradient(90deg,var(--accent-1),var(--accent-2))", color: "#fff" }}>
            {processing ? "Processing..." : "Add Member"}
          </button>
          <button onClick={() => { setMemberEmail(""); setRelationKey("father"); }} className="px-4 py-3 rounded-lg bg-white/3 border border-white/6 text-white">Reset</button>
        </div>
      </div>

      <AnimatePresence>
        {toast.text && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={`mt-3 p-3 rounded-md ${toast.type === "success" ? "bg-green-700/20 text-green-200" : toast.type === "error" ? "bg-red-700/20 text-red-200" : "bg-indigo-700/12 text-indigo-200"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
        <div className="min-h-[180px]">
          <div className="text-xs text-slate-300 mb-2">Father</div>
          <AnimatePresence>
            {family.father ? (
              <UserCard key={family.father._id} user={family.father} onRemove={() => handleRemove(family.father._id, "father")} />
            ) : (
              <motion.div layout key="no-father" className="p-4 rounded-lg border border-white/6 text-slate-300 h-[180px] flex items-center justify-center">No father</motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="min-h-[180px]">
          <div className="text-xs text-slate-300 mb-2">Mother</div>
          <AnimatePresence>
            {family.mother ? (
              <UserCard key={family.mother._id} user={family.mother} onRemove={() => handleRemove(family.mother._id, "mother")} />
            ) : (
              <motion.div layout key="no-mother" className="p-4 rounded-lg border border-white/6 text-slate-300 h-[180px] flex items-center justify-center">No mother</motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1 min-h-[180px]">
          <div className="text-xs text-slate-300 mb-2">Siblings</div>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {Array.isArray(family.siblings) && family.siblings.length > 0 ? family.siblings.map(s => (
                <UserCard key={s._id} user={s} onRemove={() => handleRemove(s._id, "sibling")} />
              )) : (
                <motion.div layout key="no-siblings" className="p-4 rounded-lg border border-white/6 text-slate-300 h-[180px] flex items-center justify-center">No siblings</motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-3 min-h-[180px]">
          <div className="text-xs text-slate-300 mb-2">Children</div>
          <div className="flex flex-wrap gap-4">
            <AnimatePresence>
              {Array.isArray(family.children) && family.children.length > 0 ? family.children.map(c => (
                <UserCard key={c._id} user={c} onRemove={() => handleRemove(c._id, "child")} />
              )) : (
                <motion.div layout key="no-children" className="p-4 rounded-lg border border-white/6 text-slate-300 w-full h-[180px] flex items-center justify-center">No children</motion.div>
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
