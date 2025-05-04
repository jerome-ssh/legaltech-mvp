"use client";
import React from "react";
import { Bell, UserCircle2 } from "lucide-react";
import TopBar from "./TopBar";

export default function HeaderBar() {
  return (
    <div className="flex justify-between text-black items-center mb-8">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="flex items-center gap-4">
        <Bell className="w-6 h-6 text-gray-600" />
        <TopBar />
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          <UserCircle2 className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
} 