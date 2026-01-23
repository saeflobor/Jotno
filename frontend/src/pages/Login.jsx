import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdArrowBack } from "react-icons/md";

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "patient",
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
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-pink-50 p-4 relative overflow-hidden'>
      {/* Animated background elements */}
      <motion.div
        className='absolute top-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl'
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className='absolute bottom-0 left-0 w-96 h-96 bg-pink-100/20 rounded-full blur-3xl'
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
      />

      <div className='relative z-10 w-full max-w-lg'>
        {/* Back button */}
        <motion.button
          onClick={() => navigate("/")}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          className='flex items-center gap-2 mb-6 text-[rgb(211,46,149)] hover:text-[rgb(190,35,130)] transition font-semibold'
        >
          <MdArrowBack className='text-xl' />
          Back
        </motion.button>

        {/* Main form container */}
        <motion.div 
          className='bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-[0px_15px_50px_rgba(211,46,149,0.25)] border border-pink-100/30'
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <motion.h2 
            className='text-3xl font-bold mb-2 text-center text-gray-900'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p 
            className='text-center text-gray-600 mb-6 text-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Sign in to your account to continue
          </motion.p>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 p-4 rounded-lg bg-red-50 border border-red-200'
            >
              <p className='text-red-700 font-semibold text-sm'>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email and Role row */}
            <div className='grid grid-cols-2 gap-4'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label className='block text-gray-700 text-sm font-semibold mb-2'>
                  Email
                </label>
                <motion.input 
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white/60 backdrop-blur-sm'
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='Enter email'
                  autoComplete='off'
                  required
                  whileFocus={{ scale: 1.02, boxShadow: "0px 8px 20px rgba(211, 46, 149, 0.2)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label className='block text-gray-700 text-sm font-semibold mb-2'>
                  Role
                </label>
                <motion.select
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition text-gray-900 bg-white/60 backdrop-blur-sm appearance-none cursor-pointer'
                  name='role'
                  value={formData.role}
                  onChange={handleChange}
                  whileFocus={{ scale: 1.02, boxShadow: "0px 8px 20px rgba(211, 46, 149, 0.2)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <option value='patient'>Patient</option>
                  <option value='doctor'>Doctor</option>
                </motion.select>
              </motion.div>
            </div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label className='block text-gray-700 text-sm font-semibold mb-2'>
                Password
              </label>
              <motion.input 
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white/60 backdrop-blur-sm'
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='Enter password'
                required
                whileFocus={{ scale: 1.02, boxShadow: "0px 8px 20px rgba(211, 46, 149, 0.2)" }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </motion.div>

            {/* Login button */}
            <motion.button 
              type='submit'
              className='w-full bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.02, boxShadow: "0px 15px 40px rgba(211, 46, 149, 0.3)" }}
              whileTap={{ scale: 0.98 }}
            >
              Login
            </motion.button>
          </form>

          {/* Register link */}
          <motion.p
            className='text-center mt-6 text-gray-600 text-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Don't have an account?{' '}
            <motion.button
              onClick={() => navigate("/register")}
              className='text-[rgb(211,46,149)] font-semibold hover:underline'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Register here
            </motion.button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
