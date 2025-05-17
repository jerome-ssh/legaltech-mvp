"use client";
import React from "react";
import { Bell, UserCircle2, LogOut } from "lucide-react";
import TopBar from "./TopBar";
import { SignOutButton } from "@clerk/nextjs";

export default function HeaderBar() {
  return (
    <div className="flex justify-between text-black items-center mb-8">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="flex items-center gap-4">
        <Bell className="w-6 h-6 text-gray-600" />
        <TopBar />
        <SignOutButton>
          <button
            title="Sign out"
            className="px-3 h-10 flex items-center justify-center rounded-lg font-semibold bg-gradient-to-r from-pink-200 to-sky-200 hover:from-pink-300 hover:to-sky-300 transition-all shadow border-none outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5 text-sky-700 group-hover:text-pink-700 transition-colors" />
            <span className="ml-1 text-sky-700 group-hover:text-pink-700 text-sm font-medium">Sign Out</span>
          </button>
        </SignOutButton>
      </div>
    </div>
  );
} 