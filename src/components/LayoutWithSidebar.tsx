"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard, FileText, Users, CreditCard, BarChart2, HelpCircle, Settings,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const { user } = useUser();
  const router = useRouter();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  // Helper to get initials
  const getInitials = (user: any) => {
    if (!user) return '';
    const first = user.firstName || '';
    const last = user.lastName || '';
    return (first[0] || '') + (last[0] || '');
  };

  // Try to get the latest profile avatar from localStorage (set by profile page on update)
  useEffect(() => {
    // Try to get from localStorage (set by profile page after upload)
    const stored = typeof window !== 'undefined' ? localStorage.getItem('profile_avatar_url') : null;
    if (stored) setProfileAvatar(stored);
  }, []);

  // Listen for changes to localStorage (profile avatar updates)
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === 'profile_avatar_url') {
        setProfileAvatar(e.newValue);
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`group ${collapsed ? "w-20" : "w-64"} bg-white shadow-md p-4 transition-all duration-300 ease-in-out hover:w-64 flex flex-col`}>
        <div>
          <div className="flex items-center justify-between mb-10">
            <div className={`text-2xl font-bold text-blue-600 ${collapsed ? "hidden group-hover:block" : "block"}`}>LawMate</div>
            <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
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
            <Link href="/clients" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
              <Users className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Clients</span>
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
          <div className="mt-10 flex flex-col items-center">
            <button onClick={() => router.push('/user-profile')} className="focus:outline-none">
              <Avatar className="w-16 h-16 mb-2">
                {profileAvatar ? (
                  <AvatarImage src={profileAvatar} alt={user?.fullName || getInitials(user)} />
                ) : user?.imageUrl ? (
                  <AvatarImage src={user.imageUrl} alt={user?.fullName || getInitials(user)} />
                ) : null}
                <AvatarFallback>
                  <span className="w-full h-full flex items-center justify-center font-bold text-lg text-blue-700">{getInitials(user)}</span>
                </AvatarFallback>
              </Avatar>
            </button>
            {!collapsed && user && (
              <span className="mt-2 text-xs text-gray-700 font-medium text-center max-w-[120px] truncate">{user.fullName || user.firstName || user.lastName}</span>
            )}
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
} 