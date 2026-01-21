// src/components/FamilyMemberSection.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserCard from "./UserCard";

const FamilyMemberSection = ({ title, member, onRemove, relationType }) => {
  return (
    <div className="min-h-[180px]">
      <div className="text-xs text-gray-600 font-semibold mb-2">{title}</div>
      <AnimatePresence mode="wait">
        {member ? (
          <UserCard
            key={member._id}
            user={member}
            onRemove={() => onRemove(member._id, relationType)}
          />
        ) : (
          <motion.div
            layout
            key={`no-${relationType}`}
            className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 h-[180px] flex items-center justify-center"
          >
            No {title.toLowerCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyMemberSection;
