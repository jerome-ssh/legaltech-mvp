"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import Dropdown from "./Dropdown";

const caseOptions = [
  "All Cases",
  "Open Cases",
  "Closed Cases",
  "My Cases"
];

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const [selectedCase, setSelectedCase] = useState(caseOptions[0]);

  return (
    <div className="flex items-center gap-4 relative">
      {/* Dropdown */}
      <Dropdown
        options={caseOptions}
        selected={selectedCase}
        onSelect={setSelectedCase}
      />

      {/* Light/Dark Toggle */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 gap-2 text-gray-500 dark:text-gray-300">
        <span
          className={`flex items-center gap-1 cursor-pointer ${theme === "light" ? "font-bold text-gray-900 dark:text-white" : ""}`}
          onClick={() => setTheme("light")}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Light
        </span>
        <span
          className={`flex items-center gap-1 cursor-pointer ${theme === "dark" ? "font-bold text-gray-900 dark:text-white" : ""}`}
          onClick={() => setTheme("dark")}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg> Dark
        </span>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search cases or documents..."
        className="bg-gray-100 dark:bg-gray-800 rounded-md px-4 py-2 text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-64"
      />

      {/* New Case Button */}
      <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-5 py-2 rounded-md flex items-center gap-2">
        <Plus className="w-4 h-4" /> New Case
      </button>
    </div>
  );
} 