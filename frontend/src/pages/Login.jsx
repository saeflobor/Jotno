import React, { useState, useEffect } from "react";
import axios from "../lib/axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowBack } from "react-icons/md";

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [typedText, setTypedText] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [hasLoginError, setHasLoginError] = useState(false);
  const navigate = useNavigate();

  const fullText = "->  যত্ন : Jotno";

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/users/login", formData);
      const token = res.data.token;
      localStorage.setItem("token", token);

      // Immediately refetch full profile (including family) so dashboard renders correct counts without a page refresh.
      const profileRes = await axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(profileRes.data);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      setHasLoginError(true);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    if (!forgotEmail) {
      setForgotError("Please enter your email address");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await axios.post("/api/users/forgot-password", { email: forgotEmail });
      setForgotMessage(res.data.message);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col lg:flex-row bg-white'>
      {/* Mobile Header - Visible only on mobile */}
      <div className='lg:hidden bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] p-4'>
        <div className='flex items-center justify-between'>
          <motion.button
            onClick={() => navigate("/")}
            whileTap={{ scale: 0.95 }}
            className='flex items-center gap-2 text-white/90 hover:text-white transition font-semibold'
          >
            <MdArrowBack className='text-xl' />
            Back
          </motion.button>
          <span className='text-white text-xl font-bold'>যত্ন : Jotno</span>
          <div className='w-16'></div>
        </div>
      </div>

      {/* Left Section - Hidden on mobile, 60% on desktop */}
      <motion.div 
        className='hidden lg:flex w-full lg:w-[60%] bg-gradient-to-b from-[rgb(211,46,149)] via-[rgb(235,80,160)] to-[rgb(255,150,190)] relative overflow-hidden flex-col justify-start pt-20 lg:pt-65 items-center p-8 lg:p-16'
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Multiple colorful gradient overlays */}
        <div className='absolute inset-0 bg-gradient-to-tr from-[rgb(211,46,149)]/30 via-transparent to-[rgb(230,60,140)]/20' />
        <div className='absolute inset-0 bg-gradient-to-bl from-pink-500/10 via-transparent to-[rgb(211,46,149)]/15' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pink-400/10 via-transparent to-transparent' />
        
        {/* Animated background elements with gradients */}
        <motion.div
          className='absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-[rgb(211,46,149)]/25 to-pink-400/25 rounded-full blur-3xl'
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className='absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-[rgb(230,60,140)]/25 to-[rgb(211,46,149)]/25 rounded-full blur-3xl'
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className='absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-pink-400/20 to-[rgb(211,46,149)]/20 rounded-full blur-3xl'
          animate={{ scale: [1, 1.4, 1], x: [-20, 20, -20], y: [-20, 20, -20] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className='absolute top-10 left-10 w-72 h-72 bg-gradient-to-bl from-[rgb(211,46,149)]/15 to-pink-300/15 rounded-full blur-3xl'
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Content */}
        <div className='relative z-10 max-w-3xl'>
          {/* Back button */}
          <motion.button
            onClick={() => navigate("/")}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            className='flex items-center gap-2 mb-12 text-white/90 hover:text-white transition font-semibold'
          >
            <MdArrowBack className='text-xl' />
            Back to Home
          </motion.button>

          <motion.div
            className='mb-6 drop-shadow-lg'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className='flex items-baseline gap-3 mt-2 text-white'>
              <span className='text-6xl font-extrabold leading-none inline-flex items-center'>{typedText}<span className="animate-pulse font-normal">|</span></span>
            </div>
            <div className='mt-10 text-3xl text-white/90 font-semibold tracking-wide'>Welcome back</div>
          </motion.div>
          
          <motion.p 
            className='text-2xl text-white/95 mb-12 leading-relaxed drop-shadow-md'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Continue managing your health journey with our comprehensive platform designed for you and your family
          </motion.p>
        </div>
      </motion.div>

      {/* Right Section - Full width on mobile, 40% on desktop */}
      <motion.div 
        className='w-full lg:w-[40%] flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-gray-50 flex-1'
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className='w-full max-w-md'>
          {/* Main form container */}
          <motion.div 
            className='bg-white p-6 sm:p-8 rounded-2xl shadow-xl'
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
          >
            <motion.h2 
              className='text-3xl font-bold mb-2 text-gray-900'
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Sign In
            </motion.h2>
            <motion.p 
              className='text-gray-600 mb-6 text-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Enter your credentials to access your account
            </motion.p>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-red-600 text-xl">⚠</div>
                    <div className="flex-1">
                      <p className="text-red-800 font-semibold text-sm">{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="text-red-700 hover:text-red-900 text-xl leading-none"
                      aria-label="Dismiss error message"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <label className='block text-gray-700 text-sm font-semibold mb-2'>
                  Email
                </label>
                <input 
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white'
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='Enter your email'
                  autoComplete='email'
                  required
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <label className='block text-gray-700 text-sm font-semibold mb-2'>
                  Password
                </label>
                <input 
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white'
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='Enter your password'
                  autoComplete='current-password'
                  required
                />
                {/* Forgot Password link */}
                <AnimatePresence>
                  {hasLoginError && (
                    <motion.div
                      className="mt-2 text-right"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotEmail(formData.email);
                          setForgotMessage("");
                          setForgotError("");
                        }}
                        className="text-sm text-[rgb(211,46,149)] font-medium hover:underline transition"
                      >
                        Forgot Password?
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Login button */}
              <motion.button 
                type='submit'
                className='w-full bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px rgba(211, 46, 149, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.button>
            </form>

            {/* Register link */}
            <motion.p
              className='text-center mt-6 text-gray-600 text-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Don't have an account?{' '}
              <button
                onClick={() => navigate("/register")}
                className='text-[rgb(211,46,149)] font-semibold hover:underline'
              >
                Register here
              </button>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForgotPassword(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {/* Success Message */}
              <AnimatePresence>
                {forgotMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200"
                  >
                    <p className="text-green-800 text-sm font-medium">{forgotMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {forgotError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200"
                  >
                    <p className="text-red-800 text-sm font-medium">{forgotError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!forgotMessage && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white"
                      required
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: forgotLoading ? 1 : 1.02 }}
                    whileTap={{ scale: forgotLoading ? 1 : 0.98 }}
                  >
                    {forgotLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </motion.button>
                </form>
              )}

              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium"
              >
                {forgotMessage ? "Close" : "Back to Sign In"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
