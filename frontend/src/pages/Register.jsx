import React, { useState, useEffect } from "react";
import axios from "../lib/axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowBack } from "react-icons/md";
import { FileText, AlertTriangle, Users, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "+88",
    password: "",
    gender: "male",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [success, setSuccess] = useState("");
  const [typedText, setTypedText] = useState("");
  const { t } = useTranslation();

  const fullText = t('register.brand');

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
    const { name, value } = e.target;
    
    // Prevent removing +88 from phone number
    if (name === "phone") {
      if (!value.startsWith("+88")) {
        setFormData({ ...formData, [name]: "+88" });
        return;
      }
      
      // Only allow digits after +88
      const afterPrefix = value.slice(3);
      if (!/^\d*$/.test(afterPrefix)) {
        return;
      }
      
      // Limit to 14 characters total (+88 + 11 digits)
      if (value.length > 14) {
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await axios.post("/api/users/register", formData);
      setSuccess(res.data.message);
      console.log(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('register.registrationFailed'));
      setSuccess("");
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
            {t('back')}
          </motion.button>
          <span className='text-white text-xl font-bold'>{t('brand')}</span>
          <div className='w-16'></div>
        </div>
      </div>

      {/* Left Section - Hidden on mobile, 60% on desktop */}
      <motion.div 
        className='hidden lg:flex w-full lg:w-[60%] bg-gradient-to-b from-[rgb(211,46,149)] via-[rgb(235,80,160)] to-[rgb(255,150,190)] relative overflow-hidden flex-col justify-start pt-16 lg:pt-35 items-center p-8 lg:p-16'
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
            {t('register.backToHome')}
          </motion.button>

          <motion.div
            className='mb-6 drop-shadow-lg'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className='text-3xl text-white/90 font-semibold tracking-wide'>{t('register.welcomeTo')}</div>
            <div className='flex items-baseline gap-3 mt-2 text-white'>
              <span className='text-6xl font-extrabold leading-none inline-flex items-center'>{typedText}<span className="animate-pulse font-normal">|</span></span>
            </div>
          </motion.div>
          
          <motion.p 
            className='text-2xl text-white/95 mb-12 leading-relaxed drop-shadow-md'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t('register.welcomeSub')}
          </motion.p>

          {/* Feature Cards */}
          <div className='grid grid-cols-2 gap-8'>
            <motion.div
              className='bg-gradient-to-r from-white/15 to-transparent backdrop-blur-md rounded-4xl p-6 transition'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className='flex items-center gap-4'>
                <FileText className='text-2xl text-white flex-shrink-0' strokeWidth={1.5} />
                <div>
                  <h3 className='text-white font-semibold text-xl mb-1'>{t('register.featureMedTitle')}</h3>
                  <p className='text-white/80 text-xs'>{t('register.featureMedDesc')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className='bg-gradient-to-r from-white/15 to-transparent backdrop-blur-md rounded-4xl p-6 transition'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <div className='flex items-center gap-4'>
                <AlertTriangle className='text-2xl text-white flex-shrink-0' strokeWidth={1.5} />
                <div>
                  <h3 className='text-white font-semibold text-xl mb-1'>{t('register.featureSOSTitle')}</h3>
                  <p className='text-white/80 text-xs'>{t('register.featureSOSDesc')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className='bg-gradient-to-r from-white/15 to-transparent backdrop-blur-md rounded-4xl p-6 transition'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className='flex items-center gap-4'>
                <Users className='text-2xl text-white flex-shrink-0' strokeWidth={1.5} />
                <div>
                  <h3 className='text-white font-semibold text-xl mb-1'>{t('register.featureFamilyTitle')}</h3>
                  <p className='text-white/80 text-xs'>{t('register.featureFamilyDesc')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className='bg-gradient-to-r from-white/15 to-transparent backdrop-blur-md rounded-4xl p-6 transition'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
            >
              <div className='flex items-center gap-4'>
                <Bell className='text-2xl text-white flex-shrink-0' strokeWidth={1.5} />
                <div>
                  <h3 className='text-white font-semibold text-xl mb-1'>{t('register.featureRemTitle')}</h3>
                  <p className='text-white/80 text-xs'>{t('register.featureRemDesc')}</p>
                </div>
              </div>
            </motion.div>
          </div>
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
              {t('register.createAccount')}
            </motion.h2>
            <motion.p 
              className='text-gray-600 mb-6 text-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {t('register.joinUs')}
            </motion.p>

            {/* Floating Success Notification */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-6 right-6 z-50 w-80 p-4 rounded-xl shadow-lg bg-green-50 border border-green-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-green-600 text-xl">✔</div>
                    <div className="flex-1">
                      <p className="text-green-800 font-semibold text-sm">{success}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuccess("")}
                      className="text-green-700 hover:text-green-900 text-xl leading-none"
                      aria-label={t('register.dismissSuccess')}
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-6 right-6 z-50 w-80 p-4 rounded-xl shadow-lg bg-red-50 border border-red-200"
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
                      aria-label={t('register.dismissError')}
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Username */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <label className='block text-gray-700 text-sm font-semibold mb-2'>
                  {t('register.usernameLabel')}
                </label>
                <input 
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white'
                  type='text'
                  name='username'
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={t('register.usernamePlaceholder')}
                  autoComplete='off'
                  required
                />
              </motion.div>

              {/* Phone and Gender row */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                >
                  <label className='block text-gray-700 text-sm font-semibold mb-2'>
                    {t('register.phoneLabel')}
                  </label>
                  <input 
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white'
                    type='tel'
                    name='phone'
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('register.phonePlaceholder')}
                    autoComplete='off'
                    required
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                >
                  <label className='block text-gray-700 text-sm font-semibold mb-2'>
                    {t('register.genderLabel')}
                  </label>
                  <select
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition text-gray-900 bg-white appearance-none cursor-pointer'
                    name='gender'
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value='male'>{t('register.male')}</option>
                    <option value='female'>{t('register.female')}</option>
                  </select>
                </motion.div>
              </div>

              {/* Timezone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <label className='block text-gray-700 text-sm font-semibold mb-2'>
                  {t('register.timezoneLabel')}
                </label>
                <select
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition text-gray-900 bg-white appearance-none cursor-pointer'
                  name='timezone'
                  value={formData.timezone}
                  onChange={handleChange}
                >
                  {[
                    "UTC",
                    "Asia/Dhaka",
                    "Asia/Kolkata",
                    "Asia/Dubai",
                    "Europe/London",
                    "Europe/Paris",
                    "America/New_York",
                    "America/Chicago",
                    "America/Los_Angeles",
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                  ].filter((tz, index, self) => self.indexOf(tz) === index).map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.65 }}
              >
                <label className='block text-gray-700 text-sm font-semibold mb-2'>
                  {t('register.emailLabel')}
                </label>
                <input 
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white'
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('register.emailPlaceholder')}
                  autoComplete='email'
                  required
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <label className='block text-gray-700 text-sm font-semibold mb-2'>
                  {t('register.passwordLabel')}
                </label>
                <input 
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white'
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('register.passwordPlaceholder')}
                  autoComplete='new-password'
                  required
                />
              </motion.div>

              {/* Register button */}
              <motion.button 
                type='submit'
                className='w-full bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.75 }}
                whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px rgba(211, 46, 149, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                {t('register.registerBtn')}
              </motion.button>
            </form>

            {/* Login link */}
            <motion.p
              className='text-center mt-6 text-gray-600 text-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {t('register.alreadyAccount')}{' '}
              <button
                onClick={() => navigate("/login")}
                className='text-[rgb(211,46,149)] font-semibold hover:underline'
              >
                {t('register.loginHere')}
              </button>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
