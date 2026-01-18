import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiFileText, FiUsers } from "react-icons/fi";
import { MdMedication, MdAccountCircle, MdSettings } from "react-icons/md";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [hoverFamily, setHoverFamily] = useState(false);
  const [hoverMedical, setHoverMedical] = useState(false);
  const [hoverMeds, setHoverMeds] = useState(false);
  const [hoverSOS, setHoverSOS] = useState(false);
  const [hoverSignOut, setHoverSignOut] = useState(false);
  const [hoverSettings, setHoverSettings] = useState(false);
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-900">Loading user data...</div>
      </div>
    );
  }
  
  const family = user?.family || {};
  const [sendingSOS, setSendingSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState("");

  // FamilyIntegration handles add/remove actions and toast internally.

  const avatarInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => (n ? n[0] : ""))
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const sendSOS = async () => {
    setSosMessage("");
    setSendingSOS(true);
    try {
      await axios.post(
        "/api/family/sos",
        { message: "I need help" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSosMessage("SOS sent to your family members.");
    } catch (err) {
      setSosMessage(err.response?.data?.message || "Failed to send SOS");
    } finally {
      setSendingSOS(false);
      setTimeout(() => setSosMessage(""), 4000);
    }
  };

  return (
    <div className="min-h-screen py-8 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={sendSOS}
            disabled={sendingSOS}
            className="px-6 py-3 rounded-full text-white font-semibold shadow-lg transition disabled:opacity-60"
            onMouseEnter={() => setHoverSOS(true)}
            onMouseLeave={() => setHoverSOS(false)}
            style={{
              background: "linear-gradient(90deg,#ff1f4b,#ff5f6d)",
              transform: "translateZ(0)",
              opacity: hoverSOS ? 0.8 : 1,
              scale: hoverSOS ? 0.90 : 1,
              transitionDuration: "200ms",
            }}
          >
            {sendingSOS ? "Sending..." : "SOS"}
          </button>
        </div>
        {sosMessage && (
          <div className="mb-4 flex justify-center">
            <div className="px-4 py-2 rounded-lg text-sm text-white bg-gray-800 shadow-md">
              {sosMessage}
            </div>
          </div>
        )}
        <div
          className="relative rounded-3xl overflow-hidden mt-40"
          style={{
            // background: "linear-gradient(135deg, rgba(211,46,149,0.1), rgba(255,255,255,1))",
            // border: "1px solid rgba(211,46,149,0.1)",
          }}
        >
          {/* <div
            className="absolute -left-40 -top-28 w-80 h-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(211,46,149,0.08), transparent 30%)",
              filter: "blur(30px)",
            }}
          /> */}
          {/* <div
            className="absolute -right-28 -bottom-20 w-72 h-72 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 70% 80%, rgba(211,46,149,0.06), transparent 30%)",
              filter: "blur(28px)",
            }}
          /> */}

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile summary */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-1 bg-white rounded-2xl p-5"
              style={{
                boxShadow: "8px 8px 20px rgba(211, 46, 149, 0.3)"
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  style={{ width: 72, height: 72 }}
                  className="rounded-full flex items-center justify-center"
                >
                  <MdAccountCircle className="text-6xl text-[rgb(211,46,149)]" />
                </div>
                <div>
                  <div className="text-gray-900 text-xl font-bold">
                    {user.username}
                  </div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    // background:
                    //   // "linear-gradient(180deg, rgba(249,250,251,1), rgba(243,244,246,1))",
                    // border: "1px solid rgba(229,231,235,1)",
                  }}
                >
                  <div className="text-s text-gray-600 text-center">Role</div>
                  <div className="font-semibold text-gray-900 text-center">{user.role}</div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{
                    // background:
                    //   "linear-gradient(180deg, rgba(249,250,251,1), rgba(243,244,246,1))",
                    // border: "1px solid rgba(229,231,235,1)",
                  }}
                >
                  <div className="text-s text-gray-600 text-center">Gender</div>
                  <div className="font-semibold text-gray-900 text-center">
                    {user.gender}
                  </div>
                </div>
                <div
                  className="rounded-lg col-span-2 flex items-center justify-center"
                  style={{
                    // background: "rgba(249,250,251,1)",
                    // // border: "1px solid rgba(229,231,235,1)",
                  }}
                >
                  <div className="text-s text-black p-3">Family size</div>
                  <div className="font-semibold text-black p-3">
                    {(Array.isArray(family.siblings)
                      ? family.siblings.length
                      : 0) +
                      (Array.isArray(family.children)
                        ? family.children.length
                        : 0) +
                      (family.father ? 1 : 0) +
                      (family.mother ? 1 : 0)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    setUser(null);
                  }}
                  className="flex-1 py-2 rounded-lg font-semibold transition"
                  onMouseEnter={() => setHoverSignOut(true)}
                  onMouseLeave={() => setHoverSignOut(false)}
                  style={{
                    background: "linear-gradient(90deg,#ff1f4b,#ff5f6d)",
                    color: "#fff",
                    opacity: hoverSignOut ? 0.8 : 1,
                    transform: hoverSignOut ? "scale(0.90)" : "scale(1)",
                    transitionDuration: "200ms",
                  }}
                >
                  Sign out
                </button>
                <button
                  onClick={() => navigate("/profile-update")}
                  className="p-2 rounded-lg transition"
                  title="Update Profile"
                  onMouseEnter={() => setHoverSettings(true)}
                  onMouseLeave={() => setHoverSettings(false)}
                  style={{
                    backgroundColor: hoverSettings ? "pink" : "transparent",
                    opacity: hoverSettings ? 0.9 : 1,
                    transform: hoverSettings ? "scale(0.90)" : "scale(1)",
                    transitionDuration: "200ms",
                  }}
                >
                  <MdSettings className="text-4xl text-[rgb(211,46,149)]" />
                </button>
              </div>
            </motion.div>

            {/* Middle area: Overview cards OR Family Integration */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2 p-5 rounded-2xl"
            >
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                  <div className="flex flex-col items-center">
                    <FiFileText className="text-[rgb(211,46,149)] text-4xl mb-4" />
                    <button
                      className="bg-purple-500 p-6 rounded-4xl text-center text-xl transition w-full h-full"
                      onClick={() => navigate("/profile-activity")}
                      onMouseEnter={() => setHoverMedical(true)}
                      onMouseLeave={() => setHoverMedical(false)}
                      style={{
                        opacity: hoverMedical ? 0.8 : 1,
                        transform: hoverMedical ? "scale(0.90)" : "scale(1)",
                        transitionDuration: "200ms",
                      }}
                    >
                      <div className="text-white font-semibold p-5">
                        Medical Record Management
                      </div>
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <FiUsers className="text-[rgb(211,46,149)] text-4xl mb-4" />
                    <button
                      className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-4xl text-center text-xl transition w-full h-full"
                      onClick={() => navigate("/family-integration")}
                      onMouseEnter={() => setHoverFamily(true)}
                      onMouseLeave={() => setHoverFamily(false)}
                      style={{
                        opacity: hoverFamily ? 0.8 : 1,
                        transform: hoverFamily ? "scale(0.90)" : "scale(1)",
                        transitionDuration: "200ms",
                      }}
                    >
                      <div className="text-white font-semibold p-5">
                        Family Management
                      </div>
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <MdMedication className="text-[rgb(211,46,149)] text-4xl mb-4" />
                    <button
                      className="bg-pink-500 p-6 rounded-4xl text-center text-xl transition w-full h-full"
                      onClick={() => alert("Coming soon!")}
                      onMouseEnter={() => setHoverMeds(true)}
                      onMouseLeave={() => setHoverMeds(false)}
                      style={{
                        opacity: hoverMeds ? 0.8 : 1,
                        // transform: hoverMeds ? "scale(0.90)" : "scale(1)",
                        transitionDuration: "200ms",
                      }}
                    >
                      <div className="text-white font-semibold p-5">
                        Lookup Meds
                      </div>
                    </button>
                  </div>
                </div>
              </>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
