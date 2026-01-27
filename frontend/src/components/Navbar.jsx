import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { GoHomeFill } from 'react-icons/go';
import { motion } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';

const Navbar = ({ user, setUser }) => {

  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    isDangerous: false,
    onConfirm: null,
  });

  const handleLogout = () => {
    setConfirmation({
      isOpen: true,
      title: "Logout",
      message: "Are you sure you want to logout from your account?",
      isDangerous: true,
      confirmText: "Logout",
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
        className='bg-[rgb(211,46,149)] backdrop-blur-md p-4'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='container mx-auto relative flex justify-center items-center'>
          <div className='absolute left-0 flex items-center gap-3'>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              style={{ transformOrigin: "center" }}
            >
              <Link to="/" className='mr-10 text-white hover:opacity-80 transition flex items-center'>
                <GoHomeFill className='text-3xl mt-1' />
              </Link>
            </motion.div>
            <motion.p 
              className='text-white'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Peace of Mind for You,<br />Care for Your Loved Ones
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link to="/" className='text-white text-[30px] font-bold'>
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
          <motion.div 
            className='absolute right-0'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {user ? (
              <motion.button 
                onClick={handleLogout}
                className='text-white bg-red-500 px-4 py-2 rounded-4xl hover:bg-red-600'
                whileHover={{ scale: 1.05, boxShadow: "0px 8px 20px rgba(255, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Logout
              </motion.button>
            ) : (
              <motion.div 
                className="flex gap-3"
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
                  <Link className="text-white mx-2 hover:underline" to="/login">
                    Login
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
                  <Link className="text-white mx-2 hover:underline" to="/register">
                    Register
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        isDangerous={confirmation.isDangerous}
        confirmText={confirmation.confirmText || "Confirm"}
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