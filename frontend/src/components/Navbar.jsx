import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { GoHomeFill } from 'react-icons/go';
import { HiMenu, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';
import { useTranslation } from 'react-i18next';

const Navbar = ({ user, setUser }) => {

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    isDangerous: false,
    onConfirm: null,
  });

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'bn' : 'en';
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    setConfirmation({
      isOpen: true,
      title: t('navbar.logoutTitle'),
      message: t('navbar.logoutMessage'),
      isDangerous: true,
      confirmText: t('navbar.logout'),
      onConfirm: () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate('/');
      },
    });
  }

  return (
    <nav className='bg-white'>
      <motion.div 
        className='bg-[rgb(211,46,149)] backdrop-blur-md p-3 sm:p-4'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='container mx-auto flex justify-between items-center'>
          {/* Left: Home + Tagline (hidden on mobile) */}
          <div className='flex items-center gap-2 sm:gap-3'>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              style={{ transformOrigin: "center" }}
            >
              <Link to="/" className='text-white hover:opacity-80 transition flex items-center'>
                <GoHomeFill className='text-2xl sm:text-3xl' />
              </Link>
            </motion.div>
            <motion.p 
              className='text-white text-xs sm:text-sm hidden md:block'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {t('navbar.tagline').split('\n').map((line, i, arr) => (
                <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
              ))}
            </motion.p>
          </div>

          {/* Center: Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='absolute left-1/2 transform -translate-x-1/2'
          >
            <Link to="/" className='text-white text-xl sm:text-2xl md:text-[30px] font-bold whitespace-nowrap'>
              <motion.button 
                onClick={(e) => {
                  if (user) {
                    e.preventDefault();
                    window.location.href = '/dashboard';
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                যত্ন : Jotno
              </motion.button>
            </Link>
          </motion.div>

          {/* Right: Desktop menu */}
          <motion.div 
            className='hidden sm:flex items-center gap-2'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Language toggle */}
            <motion.button
              onClick={toggleLanguage}
              className='text-white border border-white/60 px-2.5 py-1 rounded-full text-xs sm:text-sm hover:bg-white/20 transition mr-10'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={t('navbar.switchLangTitle')}
            >
              {t('navbar.switchLang')}
            </motion.button>
            {user ? (
              <motion.button 
                onClick={handleLogout}
                className='text-white bg-red-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base hover:bg-red-600'
                whileHover={{ scale: 1.05, boxShadow: "0px 8px 20px rgba(255, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {t('navbar.logout')}
              </motion.button>
            ) : (
              <motion.div 
                className="flex gap-2 sm:gap-3"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                initial="hidden"
                animate="show"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    show: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link className="text-white text-sm sm:text-base hover:underline" to="/login">
                    {t('navbar.login')}
                  </Link>
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    show: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link className="text-white text-sm sm:text-base hover:underline" to="/register">
                    {t('navbar.register')}
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='sm:hidden text-white p-1'
            aria-label={t('navbar.toggleMenu')}
          >
            {mobileMenuOpen ? (
              <HiX className='text-2xl' />
            ) : (
              <HiMenu className='text-2xl' />
            )}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className='sm:hidden mt-3 pt-3 border-t border-white/20'
            >
              {user ? (
                <motion.button 
                  onClick={handleLogout}
                  className='w-full text-white bg-red-500 px-4 py-2 rounded-full hover:bg-red-600 text-sm'
                  whileTap={{ scale: 0.95 }}
                >
                  {t('navbar.logout')}
                </motion.button>
              ) : (
                <div className='flex flex-col gap-2'>
                  <Link 
                    to="/login" 
                    className="text-white text-center py-2 hover:bg-white/10 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navbar.login')}
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-white text-center py-2 hover:bg-white/10 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navbar.register')}
                  </Link>
                </div>
              )}
              <button
                onClick={toggleLanguage}
                className='w-full text-white border border-white/60 py-2 rounded-lg text-sm hover:bg-white/20 transition mt-1'
              >
                {t('navbar.switchLang')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        isDangerous={confirmation.isDangerous}
        confirmText={confirmation.confirmText || t('confirm')}
        onConfirm={() => {
          if (confirmation.onConfirm) {
            confirmation.onConfirm();
          }
          setConfirmation({ ...confirmation, isOpen: false });
        }}
        onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
      />
    </nav>
  );
}

export default Navbar