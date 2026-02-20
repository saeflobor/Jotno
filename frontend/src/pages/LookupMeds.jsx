import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MdArrowBack, MdSearch } from "react-icons/md";
import { PiPillBold } from "react-icons/pi";
import { Pill, AlertCircle, Loader2 } from "lucide-react";

const LookupMeds = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Load initial medicines on mount
  useEffect(() => {
    fetchMedicines("");
  }, []);

  const fetchMedicines = async (query) => {
    setLoading(true);
    setError("");
    setHasSearched(true);
    
    try {
      const endpoint = query 
        ? `/api/medicines/${encodeURIComponent(query)}`
        : "/api/medicines/";
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setMedicines(response.data.data);
      } else {
        setMedicines([]);
        setError(response.data.message || "No medicines found");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch medicines");
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMedicines(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    setHasSearched(false);
    setError("");
    fetchMedicines("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background blobs */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-red-100/20 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
      />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => navigate("/dashboard")}
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <MdArrowBack className="text-2xl text-gray-700" />
                </motion.button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <PiPillBold className="text-2xl text-red-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lookup Meds</h1>
                    <p className="text-sm text-gray-600">Search and explore medicine information</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by medicine name (e.g., Aspirin, Ibuprofen)..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm text-gray-900 placeholder-gray-500 text-base font-medium"
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Search"
                )}
              </motion.button>
              {hasSearched && (
                <motion.button
                  type="button"
                  onClick={handleClear}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Clear
                </motion.button>
              )}
            </form>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800">{error}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>
          )}

          {/* Medicine Cards */}
          {!loading && medicines.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-4 text-sm text-gray-600">
                Found {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {medicines.map((medicine, index) => (
                    <motion.div
                      key={medicine.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                          <Pill className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 text-lg">
                            {medicine.brand_name || "Unknown Brand"}
                          </h3>
                          {medicine.generic && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Generic:</span> {medicine.generic}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dosage Form & Strength */}
                      <div className="mb-3 space-y-2">
                        {medicine.dosage_form && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Form:</span>
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                              {medicine.dosage_form}
                            </span>
                          </div>
                        )}
                        {medicine.strength && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Strength:</span>
                            <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                              {medicine.strength}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Manufacturer */}
                      {medicine.manufacturer && (
                        <div className="pt-3 border-t border-gray-100 mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Manufacturer
                          </p>
                          <p className="text-sm text-gray-700">
                            {medicine.manufacturer}
                          </p>
                        </div>
                      )}

                      {/* Package & Price */}
                      {medicine.package && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Package & Price
                          </p>
                          <p className="text-sm text-gray-700">
                            {medicine.package}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && medicines.length === 0 && hasSearched && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PiPillBold className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Medicines Found
              </h3>
              <p className="text-gray-600 mb-6">
                Try searching with a different medicine name
              </p>
              <motion.button
                onClick={handleClear}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Clear Search
              </motion.button>
            </motion.div>
          )}

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Information Source</p>
                <p>
                  Medicine information is from the Bangladesh medicine dataset containing over 21,000 medicines. 
                  Data includes brand names, generic names, manufacturers, dosage forms, and pricing. 
                  This is for informational purposes only and should not be considered medical advice. 
                  Always consult with a healthcare professional before taking any medication.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LookupMeds;
