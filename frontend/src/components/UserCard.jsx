// src/components/UserCard.jsx
import React from "react";
import { motion } from "framer-motion";

const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();

const UserCard = ({ user, onRemove }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0.0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative overflow-hidden rounded-2xl shadow-2xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.06)",
        minWidth: 260,
        maxWidth: 320,
      }}
    >
      {/* gradient accent bar */}
      <div style={{ height: 6, background: "linear-gradient(90deg,var(--accent-1),var(--accent-2),var(--accent-3))" }} />

      <div className="p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-full text-white font-extrabold"
            style={{
              height: 56,
              width: 56,
              background: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 18,
            }}
          >
            <div style={{
              height: 44,
              width: 44,
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,var(--accent-1),var(--accent-2))",
              boxShadow: "0 6px 18px rgba(12,18,40,0.45)"
            }}>
              {initials(user.username)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-white text-lg font-semibold truncate">{user.username}</h3>
              {onRemove && (
                <button
                  onClick={() => window.confirm("Remove this member?") && onRemove()}
                  className="ml-2 inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium"
                  style={{
                    background: "linear-gradient(90deg,#ff7a7a,#ff3d3d)",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 6px 18px rgba(255,61,61,0.18)"
                  }}
                  title="Remove member"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-200 truncate" style={{ opacity: 0.9 }}>{user.email}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="py-2 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
            <div className="text-xs text-slate-300">Role</div>
            <div className="mt-1 font-medium text-white">{user.role}</div>
          </div>

          <div className="py-2 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
            <div className="text-xs text-slate-300">Gender</div>
            <div className="mt-1 font-medium text-white">{user.gender}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-400">Joined</div>
          <div className="text-xs text-slate-300">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;



