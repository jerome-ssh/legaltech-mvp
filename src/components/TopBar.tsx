"use client";
import React, { useState, useContext } from "react";
import { Plus, Calendar } from "lucide-react";
import Dropdown from "./Dropdown";
import { ColorModeContext } from '@/components/providers/MuiThemeProvider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const caseOptions = [
  "All Cases",
  "Open Cases",
  "Closed Cases",
  "My Cases"
];

export default function TopBar() {
  const [selectedCase, setSelectedCase] = useState(caseOptions[0]);
  const colorMode = useContext(ColorModeContext);

  return (
    <div className="flex items-center gap-4 relative">
      {/* Schedule Button */}
      <button className="bg-pink-400 hover:bg-pink-500 text-white font-extrabold px-5 py-2 rounded-md flex items-center gap-2">
        <Calendar className="w-4 h-4" /> Schedule
      </button>

      {/* New Case Button */}
      <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-5 py-2 rounded-md flex items-center gap-2">
        <Plus className="w-4 h-4" /> New Case
      </button>
    </div>
  );
} 