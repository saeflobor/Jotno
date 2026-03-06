import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Bell,
  Users,
  AlertTriangle,
  Calendar,
  Activity,
  FileText,
  Heart,
  UserRound,
  Pill,
  Sparkles,
} from "lucide-react";

const Home = ({ user, error }) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const features = [
    {
      id: 1,
      icon: Bell,
      title: "Medication Reminders",
      description:
        "Timely alerts via notifications or SMS. Never miss a dose again InshaAllah",
      visible: true,
    },
    {
      id: 2,
      icon: Users,
      title: "Family Supervision",
      description:
        "Monitor medication adherence, access records (with permission), view health summaries",
      visible: true,
    },
    {
      id: 3,
      icon: AlertTriangle,
      title: "Emergency SOS",
      description:
        "One-tap SOS button notifies family instantly with email and optional location",
      visible: true,
    },
    {
      id: 4,
      icon: Calendar,
      title: "Appointment Tracking & Doctors List",
      description:
        "Never miss a doctor's appointment & find nearby healthcare professionals easily",
      visible: showAllFeatures,
    },
    {
      id: 5,
      icon: Activity,
      title: "Health Monitoring",
      description:
        "Track vital signs and health metrics with easy-to-use tools",
      visible: showAllFeatures,
    },
    {
      id: 6,
      icon: FileText,
      title: "Medical Records",
      description:
        "Secure digital storage for all your important medical documents, accessible anytime, anywhere",
      visible: showAllFeatures,
    },
    {
      id: 7,
      icon: Pill,
      title: "Drug Lookup",
      description:
        "Search comprehensive medicine information and drug interactions",
      visible: showAllFeatures,
    },
    {
      id: 8,
      icon: Sparkles,
      title: "Smart Scanning (AI)",
      description:
        "Data inputs automatically retrieved from prescriptions & reports using AI",
      visible: showAllFeatures,
    },
  ];

  const testimonials = [
    {
      id: 1,
      text: "Since using যত্ন, my father never misses his medication. The peace of mind is priceless.",
      author: "Rahman M. Jr.",
      relationship: "Son of Rahman M. Sr.",
      icon: UserRound,
    },
    {
      id: 2,
      text: "The SOS feature saved my grandmother when she fell. Help arrived within minutes!",
      author: "Farhana K.",
      relationship: "Granddaughter of Rahima K.",
      icon: UserRound,
    },
  ];

  return (
    <div>
      {error && <p className='text-red-500 mb-4 text-sm'>{error}</p>}
      <div className="relative min-h-screen overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-md bg-white"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-white/30"
          aria-hidden="true"
        />
        <div className="relative">


          <section className="container mx-auto px-4 py-8 sm:py-16 md:py-24">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mb-8 sm:mb-16">
              <motion.div
                className="md:w-1/2"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              >
                <motion.h1
                  className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900"
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Peace of Mind for You,<br />Care for Your Loved Ones
                </motion.h1>
                <motion.p
                  className="text-base sm:text-lg mb-5 sm:mb-6 text-gray-700"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  যত্ন : Jotno helps elderly users have their healthcare needs met, while keeping families connected and informed.
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 sm:gap-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/register"
                      className="bg-[rgb(211,46,149)] hover:bg-[rgb(180,36,126)] text-white px-6 py-3 rounded-lg font-medium transition duration-300 transform hover:scale-105 hover:opacity-90 inline-block"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/login"
                      className="border-2 border-[rgb(211,46,149)] text-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)] hover:text-white px-6 py-3 rounded-lg font-medium transition duration-300 transform hover:scale-105 hover:opacity-90 inline-block"
                    >
                      Login
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
              <motion.div
                className="md:w-1/2"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100, delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.img
                  src={"Smiling_Old_Couple_Black.jpg"}
                  alt="Happy elderly couple"
                  className="rounded-2xl w-full shadow-[20px_20px_40px_rgba(211,46,149,1)]"
                  initial={{ boxShadow: "0px 0px 0px rgba(211,46,149,0)" }}
                  animate={{ boxShadow: "20px 20px 40px rgba(211,46,149,1)" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </motion.div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-10 sm:py-16">
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            >
              How We Help
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {features.map((feature, index) => {
                  if (!feature.visible) return null;
                  const IconComponent = feature.icon;
                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 50, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 100,
                          damping: 12
                        }
                      }}
                      exit={{
                        opacity: 0,
                        y: -30,
                        scale: 0.8,
                        transition: { duration: 0.3 }
                      }}
                      whileHover={{
                        boxShadow: "0px 20px 40px rgba(211, 46, 149, 0.4)",
                        transition: { duration: 0.3 }
                      }}
                      className="bg-gray-100/60 backdrop-blur-[40px] p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300"
                    >
                      <motion.div
                        className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center mb-4"
                      >
                        <IconComponent className="text-black w-6 h-6" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                      <p className="text-gray-800">{feature.description}</p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <motion.button
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                className="bg-[rgb(211,46,149)] hover:bg-[rgb(180,36,126)] text-white px-6 py-3 rounded-lg font-medium transition duration-300 transform hover:scale-105 hover:opacity-90 flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>
                  {showAllFeatures
                    ? "Show Fewer Features"
                    : "View All Features"}
                </span>
                <motion.div
                  animate={{ rotate: showAllFeatures ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {showAllFeatures ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </motion.div>
              </motion.button>
            </motion.div>
          </section>

          <motion.section
            className="container mx-auto px-4 py-10 sm:py-16 bg-white/70 backdrop-blur-[40px] rounded-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900"
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              What Families Say
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.2
                  }
                }
              }}
            >
              {testimonials.map((testimonial, index) => {
                const IconComponent = testimonial.icon;
                return (
                  <motion.div
                    key={testimonial.id}
                    className="bg-gray-100/60 backdrop-blur-[40px] p-6 rounded-lg shadow"
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: index % 2 === 0 ? -100 : 100,
                        rotate: index % 2 === 0 ? -10 : 10
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                        rotate: 0,
                        transition: {
                          type: "spring",
                          stiffness: 100,
                          damping: 15
                        }
                      }
                    }}
                    whileHover={{
                      scale: 1.05,
                      y: -10,
                      boxShadow: "0px 20px 40px rgba(211, 46, 149, 0.3)",
                      transition: { duration: 0.3 }
                    }}
                  >
                    <motion.p
                      className="italic mb-4 text-gray-900"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      {testimonial.text}
                    </motion.p>
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        className="w-12 h-12 rounded-full mr-4 bg-pink-200 flex items-center justify-center"
                        whileHover={{
                          scale: 1.2,
                          rotate: 360,
                          transition: { duration: 0.5 }
                        }}
                      >
                        <IconComponent className="w-6 h-6 text-black" />
                      </motion.div>
                      <div>
                        <h4
                          className="font-semibold text-gray-900"
                        >
                          {testimonial.author}
                        </h4>
                        <p
                          className="text-sm text-gray-700"
                        >
                          {testimonial.relationship}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            className="container mx-auto px-4 py-10 sm:py-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="bg-[rgb(211,46,149)]/60 rounded-xl p-5 sm:p-8 text-center text-gray-900"
              whileHover={{
                scale: 1.02,
                boxShadow: "0px 30px 60px rgba(211, 46, 149, 0.4)"
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Ready to Get Started?
              </motion.h2>
              <motion.p
                className="text-base sm:text-lg mb-5 sm:mb-6 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Join thousands of families who trust যত্ন : Jotno for their
                loved ones' care
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="inline-block bg-white text-[rgb(211,46,149)] hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition duration-300 transform hover:scale-105 hover:opacity-90"
                >
                  Sign Up Free
                </Link>
              </motion.div>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Home;
