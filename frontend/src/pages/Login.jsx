import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowBack } from "react-icons/md";

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className='min-h-screen flex bg-white'>
      {/* Left Section - 60% */}
      <motion.div 
        className='w-[60%] bg-gradient-to-b from-[rgb(211,46,149)] via-[rgb(235,80,160)] to-[rgb(255,150,190)] relative overflow-hidden flex flex-col justify-start pt-65 items-center p-16'
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

          <motion.h1 
            className='text-6xl font-bold text-white mb-6 drop-shadow-lg'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Welcome Back to Jotno
          </motion.h1>
          
          <motion.p 
            className='text-2xl text-white/95 mb-12 leading-relaxed drop-shadow-md'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Continue managing your health journey with our comprehensive platform designed for you and your family.
          </motion.p>
        </div>
      </motion.div>

      {/* Right Section - 40% */}
      <motion.div 
        className='w-[40%] flex items-center justify-center p-12 bg-gray-50'
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className='w-full max-w-md'>
          {/* Main form container */}
          <motion.div 
            className='bg-white p-8 rounded-2xl shadow-xl'
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
    </div>
  );
};

export default Login;
