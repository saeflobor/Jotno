import { useParams, useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function VerifyEmail({ setUser }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.post("/api/users/verifyemail", { token });

        localStorage.setItem("token", res.data.token);

        setUser(res.data.user);

        navigate("/dashboard");
      } catch (err) {
        setMessage(t('emailVerification.expired'));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate, setUser]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      {/* Floating Error Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 right-6 z-50 w-80 p-4 rounded-xl shadow-lg bg-red-50 border border-red-200"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-600">⚠</div>
              <div className="flex-1">
                <p className="text-red-800 font-semibold">{message}</p>
              </div>
              <button
                type="button"
                onClick={() => setMessage("")}
                className="text-red-700 hover:text-red-900"
                aria-label={t('emailVerification.dismissError')}
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: "12px", color: "#4b5563", fontSize: "14px" }}>
        {t('emailVerification.breadcrumb')} <span style={{ color: "#111827", fontWeight: 600 }}>{t('emailVerification.title')}</span>
      </div>
      <h2>{t('emailVerification.title')}</h2>

      {loading && <p>{t('emailVerification.verifying')}</p>}
    </div>
  );
}
