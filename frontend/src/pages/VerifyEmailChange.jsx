import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyEmailChange({ setUser }) {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmailChange = async () => {
      try {
        const res = await axios.post("/api/users/verify-email-change", { token });

        localStorage.setItem("token", res.data.token);

        setUser(res.data.user);
        setSuccess(true);
        setMessage("Email changed successfully! Redirecting to dashboard...");

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } catch (err) {
        setMessage(err.response?.data?.message || "Verification link expired or invalid");
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmailChange();
    }
  }, [token, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        {/* Floating Notification */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`fixed top-6 right-6 z-50 w-80 p-4 rounded-xl shadow-lg ${
                success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 text-xl ${success ? "text-green-600" : "text-red-600"}`}>
                  {success ? "✔" : "⚠"}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${success ? "text-green-800" : "text-red-800"}`}>
                    {message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMessage("")}
                  className={success ? "text-green-700 hover:text-green-900" : "text-red-700 hover:text-red-900"}
                  aria-label="Dismiss message"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg text-center"
        >
          <div className="mb-4 text-sm text-gray-600">
            Home / <span className="text-gray-900 font-semibold">Email Change Verification</span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Email Change Verification</h2>

          {loading && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(211,46,149)]"></div>
              <p className="text-gray-600">Verifying your new email...</p>
            </div>
          )}

          {!loading && !success && (
            <div className="mt-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-[rgb(211,46,149)] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
