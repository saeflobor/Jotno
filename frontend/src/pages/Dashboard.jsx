// src/pages/Dashboard.jsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Axios is kept here in case Dashboard needs it later; integration logic moved
// into FamilyIntegration component.

const Dashboard = ({ user, setUser }) => {
  const family = user?.family || {};
  const navigate = useNavigate();

  // FamilyIntegration handles add/remove actions and toast internally.

  const avatarInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => (n ? n[0] : ""))
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.04))", border: "1px solid rgba(255,255,255,0.03)" }}>
          <div className="absolute -left-40 -top-28 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle at 30% 20%, rgba(124,58,237,0.18), transparent 30%)", filter: "blur(30px)" }} />
          <div className="absolute -right-28 -bottom-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle at 70% 80%, rgba(6,182,212,0.16), transparent 30%)", filter: "blur(28px)" }} />

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile summary */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1 bg-gradient-to-br from-white/3 to-white/2 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-4">
                <div style={{ width: 72, height: 72 }} className="rounded-full flex items-center justify-center">
                  <div style={{ width: 64, height: 64, borderRadius: 999, background: "linear-gradient(135deg,var(--accent-1),var(--accent-2))", boxShadow: "0 10px 30px rgba(2,6,23,0.6)" }} className="flex items-center justify-center text-white font-extrabold text-xl">
                    {avatarInitials(user.username)}
                  </div>
                </div>
                <div>
                  <div className="text-white text-xl font-bold">{user.username}</div>
                  <div className="text-sm text-slate-200">{user.email}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="text-xs text-slate-300">Role</div>
                  <div className="font-semibold text-white">{user.role}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="text-xs text-slate-300">Gender</div>
                  <div className="font-semibold text-white">{user.gender}</div>
                </div>
                <div className="p-3 rounded-lg col-span-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="text-xs text-slate-300">Family size</div>
                  <div className="font-semibold text-white">{(Array.isArray(family.siblings) ? family.siblings.length : 0) + (Array.isArray(family.children) ? family.children.length : 0) + (family.father ? 1 : 0) + (family.mother ? 1 : 0)}</div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={() => { localStorage.removeItem("token"); setUser(null); }} className="flex-1 py-2 rounded-lg font-semibold" style={{ background: "linear-gradient(90deg,#ff7a7a,#ff3d3d)", color: "#fff" }}>
                  Sign out
                </button>
                <button onClick={() => { alert("Coming soon!") }} className="px-4 py-2 rounded-lg border border-white/6 text-white">Share</button>
              </div>
            </motion.div>

            {/* Middle area: Overview cards OR Family Integration */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-b from-white/4 to-transparent border border-white/5">
                <>
                  <div className="text-lg font-bold text-white mb-4">Choose an action</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button className="p-6 rounded-xl border border-white/6 bg-white/3 text-white text-left hover:bg-white/5 transition" onClick={() => alert("Coming soon!")}> 
                      <div className="text-sm text-slate-300 mb-1">Overview</div>
                      <div className="text-white font-semibold">Profile & Activity</div>
                    </button>
                    <button className="p-6 rounded-xl border border-white/6 bg-white/3 text-white text-left hover:bg-white/5 transition" onClick={() => navigate("/family-integration") }>
                      <div className="text-sm text-slate-300 mb-1">Integration</div>
                      <div className="text-white font-semibold">Family Integration</div>
                    </button>
                    <button className="p-6 rounded-xl border border-white/6 bg-white/3 text-white text-left hover:bg-white/5 transition" onClick={() => alert("Coming soon!")}> 
                      <div className="text-sm text-slate-300 mb-1">Settings</div>
                      <div className="text-white font-semibold">Preferences</div>
                    </button>
                  </div>
                </>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;