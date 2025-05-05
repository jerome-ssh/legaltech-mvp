"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`group ${collapsed ? "w-20" : "w-64"} bg-white shadow-md p-4 transition-all duration-300 ease-in-out hover:w-64`}
      >
        <div className="flex items-center justify-between mb-10">
          <div className={`text-2xl font-bold text-blue-600 ${collapsed ? "hidden group-hover:block" : "block"}`}>
            LawMate
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className="space-y-6 text-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 font-semibold">
            <LayoutDashboard className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Dashboard</span>
          </Link>
          <Link href="/documents" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
            <FileText className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Documents</span>
          </Link>
          <Link href="/crm" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
            <Users className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>CRM</span>
          </Link>
          <Link href="/billing" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
            <CreditCard className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Billing</span>
          </Link>
          <Link href="/analytics" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
            <BarChart2 className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Analytics</span>
          </Link>
          <Link href="/help" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
            <HelpCircle className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Help</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
            <Settings className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
} 