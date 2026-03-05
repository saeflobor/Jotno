import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MdArrowBack,
  MdClose,
  MdFilterList,
  MdKeyboardArrowDown,
  MdNavigateNext,
  MdNavigateBefore,
} from "react-icons/md";
import { PiPillBold } from "react-icons/pi";
import { Pill, AlertCircle, Loader2, Search, X } from "lucide-react";

const LIMIT = 30;

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Highlight matching text
function HighlightText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 text-yellow-900 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const LookupMeds = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [dosageForms, setDosageForms] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [selectedDosage, setSelectedDosage] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Load filters on mount
  useEffect(() => {
    axios
      .get("/api/medicines/filters")
      .then((res) => {
        if (res.data.success) {
          setDosageForms(res.data.data.dosageForms || []);
          setManufacturers(res.data.data.manufacturers || []);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch medicines when debounced query, filters, or page changes
  useEffect(() => {
    fetchMedicines(debouncedQuery, page, selectedDosage, selectedManufacturer);
  }, [debouncedQuery, page, selectedDosage, selectedManufacturer]);

  // Reset page when query or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedDosage, selectedManufacturer]);

  const fetchMedicines = async (query, pg, dosage, mfg) => {
    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (dosage) params.set("dosage_form", dosage);
      if (mfg) params.set("manufacturer", mfg);
      params.set("page", pg);
      params.set("limit", LIMIT);

      const response = await axios.get(`/api/medicines?${params.toString()}`);

      if (response.data.success) {
        setMedicines(response.data.data);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setMedicines([]);
        setTotalCount(0);
        setError(response.data.message || "No medicines found");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch medicines");
      setMedicines([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedDosage("");
    setSelectedManufacturer("");
    setPage(1);
    setError("");
    inputRef.current?.focus();
  };

  const hasActiveFilters = selectedDosage || selectedManufacturer;
  const activeFilterCount = [selectedDosage, selectedManufacturer].filter(
    Boolean
  ).length;

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <motion.button
                  onClick={() => navigate("/dashboard")}
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <MdArrowBack className="text-xl sm:text-2xl text-gray-700" />
                </motion.button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                    <PiPillBold className="text-xl sm:text-2xl text-red-600" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                      Lookup Meds
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      Search and explore medicine information
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by brand name, generic name, or manufacturer..."
                autoFocus
                className="w-full pl-12 pr-24 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm text-gray-900 placeholder-gray-400 text-base font-medium transition"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {(searchQuery || hasActiveFilters) && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={handleClear}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                    title="Clear all"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  whileTap={{ scale: 0.95 }}
                  className={`p-1.5 rounded-lg transition relative ${
                    showFilters || hasActiveFilters
                      ? "bg-pink-100 text-pink-600"
                      : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  }`}
                  title="Toggle filters"
                >
                  <MdFilterList className="text-xl" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Live search hint */}
            {!searchQuery && !hasActiveFilters && (
              <p className="text-xs text-gray-400 mt-2 ml-1">
                Start typing to search across 21,000+ medicines instantly
              </p>
            )}
          </motion.div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MdFilterList className="text-lg" />
                      Filters
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setSelectedDosage("");
                          setSelectedManufacturer("");
                        }}
                        className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Dosage Form Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Dosage Form
                      </label>
                      <div className="relative">
                        <select
                          value={selectedDosage}
                          onChange={(e) => setSelectedDosage(e.target.value)}
                          className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value="">All Forms</option>
                          {dosageForms.map((form) => (
                            <option key={form} value={form}>
                              {form}
                            </option>
                          ))}
                        </select>
                        <MdKeyboardArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                      </div>
                    </div>

                    {/* Manufacturer Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Manufacturer
                      </label>
                      <div className="relative">
                        <select
                          value={selectedManufacturer}
                          onChange={(e) =>
                            setSelectedManufacturer(e.target.value)
                          }
                          className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value="">All Manufacturers</option>
                          {manufacturers.map((mfg) => (
                            <option key={mfg} value={mfg}>
                              {mfg}
                            </option>
                          ))}
                        </select>
                        <MdKeyboardArrowDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Summary */}
          {hasSearched && !loading && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <p className="text-sm text-gray-500">
                {totalCount > 0 ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-gray-700">
                      {(page - 1) * LIMIT + 1}–
                      {Math.min(page * LIMIT, totalCount)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-700">
                      {totalCount.toLocaleString()}
                    </span>{" "}
                    result{totalCount !== 1 ? "s" : ""}
                    {searchQuery && (
                      <>
                        {" "}
                        for &ldquo;
                        <span className="font-semibold text-gray-700">
                          {searchQuery}
                        </span>
                        &rdquo;
                      </>
                    )}
                  </>
                ) : (
                  "No results found"
                )}
              </p>
              {/* Active filter badges */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedDosage && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-pink-50 text-pink-700 rounded-full border border-pink-200">
                      {selectedDosage}
                      <button
                        onClick={() => setSelectedDosage("")}
                        className="hover:text-pink-900"
                      >
                        <MdClose className="text-sm" />
                      </button>
                    </span>
                  )}
                  {selectedManufacturer && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-pink-50 text-pink-700 rounded-full border border-pink-200 max-w-[200px] truncate">
                      {selectedManufacturer}
                      <button
                        onClick={() => setSelectedManufacturer("")}
                        className="hover:text-pink-900 flex-shrink-0"
                      >
                        <MdClose className="text-sm" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              <p className="text-sm text-gray-400">Searching medicines...</p>
            </div>
          )}

          {/* Medicine Cards */}
          {!loading && medicines.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                <AnimatePresence mode="popLayout">
                  {medicines.map((medicine, index) => (
                    <motion.div
                      key={medicine.id || index}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                      className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-pink-200 transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-red-50 rounded-lg flex-shrink-0 group-hover:bg-red-100 transition">
                          <Pill className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base leading-tight">
                            <HighlightText
                              text={medicine.brand_name || "Unknown Brand"}
                              query={searchQuery}
                            />
                          </h3>
                          {medicine.generic && (
                            <p className="text-sm text-gray-500 mt-1 leading-snug">
                              <HighlightText
                                text={medicine.generic}
                                query={searchQuery}
                              />
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tags row */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {medicine.dosage_form && (
                          <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                            {medicine.dosage_form}
                          </span>
                        )}
                        {medicine.strength && (
                          <span className="text-[11px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                            {medicine.strength}
                          </span>
                        )}
                      </div>

                      {/* Manufacturer */}
                      {medicine.manufacturer && (
                        <div className="pt-2.5 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">
                            Manufacturer
                          </p>
                          <p className="text-sm text-gray-700">
                            <HighlightText
                              text={medicine.manufacturer}
                              query={searchQuery}
                            />
                          </p>
                        </div>
                      )}

                      {/* Package & Price */}
                      {medicine.package && (
                        <div className="pt-2.5 mt-2.5 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 mb-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <MdNavigateBefore className="text-lg" />
                    Previous
                  </motion.button>

                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {generatePageNumbers(page, totalPages).map((p, i) =>
                      p === "..." ? (
                        <span
                          key={`dots-${i}`}
                          className="px-2 text-gray-400 text-sm"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 text-sm font-medium rounded-lg transition ${
                            p === page
                              ? "bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  {/* Mobile page indicator */}
                  <span className="sm:hidden text-sm text-gray-500 font-medium">
                    {page} / {totalPages}
                  </span>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                    <MdNavigateNext className="text-lg" />
                  </motion.button>
                </div>
              )}
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
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different spelling or a more general term.`
                  : "Try searching with a different medicine name."}
              </p>
              <motion.button
                onClick={handleClear}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
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
            className="mt-10 p-4 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Information Source</p>
                <p>
                  Medicine information is from the Bangladesh medicine dataset
                  containing over 21,000 medicines. Data includes brand names,
                  generic names, manufacturers, dosage forms, and pricing. This
                  is for informational purposes only and should not be considered
                  medical advice. Always consult with a healthcare professional
                  before taking any medication.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Helper: generate smart page numbers with ellipsis
function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

export default LookupMeds;
