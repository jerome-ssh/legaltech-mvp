"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import {
  LayoutDashboard, FileText, Users, CreditCard, BarChart2, HelpCircle, Settings,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

// ProfileContext for sharing profile data (including avatar_url)
export const ProfileContext = createContext<{ 
  avatarUrl: string | null; 
  clerkImageUrl: string | null;
  isLoading: boolean;
}>({ 
  avatarUrl: null, 
  clerkImageUrl: null,
  isLoading: true 
});
export const useProfile = () => useContext(ProfileContext);

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const { user } = useUser();
  const router = useRouter();
  // Use avatarUrl and clerkImageUrl from ProfileContext
  const { avatarUrl, clerkImageUrl, isLoading } = useProfile();

  // Track sidebar width for continuous avatar scaling
  const [sidebarWidth, setSidebarWidth] = useState(80); // px, matches w-20
  const minSidebar = 80; // w-20
  const maxSidebar = 256; // w-64
  const minAvatar = 48; // w-12
  const maxAvatar = 96; // w-24

  // Update sidebar width on expand/collapse
  useEffect(() => {
    setSidebarWidth(collapsed ? minSidebar : maxSidebar);
  }, [collapsed]);

  // Calculate avatar size based on sidebar width
  const avatarSize = minAvatar + ((sidebarWidth - minSidebar) / (maxSidebar - minSidebar)) * (maxAvatar - minAvatar);

  // Helper to get initials
  const getInitials = (user: any) => {
    if (!user) return '';
    const first = user.firstName || '';
    const last = user.lastName || '';
    return (first[0] || '') + (last[0] || '');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`group ${collapsed ? "w-20" : "w-64"} shadow-md p-4 transition-all duration-300 ease-in-out hover:w-64 flex flex-col bg-white dark:bg-[#23315c]`}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        <div>
          <div className="flex items-center justify-between mb-10">
            <div className={`text-2xl font-bold text-blue-600 dark:text-white ${collapsed ? "hidden group-hover:block" : "block"}`}>LawMate</div>
            <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          <nav className="space-y-6 text-black dark:text-white">
            <Link href="/dashboard" className="flex items-center gap-2 text-black dark:text-white font-semibold">
              <LayoutDashboard className="w-5 h-5 text-black dark:text-white" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Dashboard</span>
            </Link>
            <Link href="/documents" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white">
              <FileText className="w-5 h-5 text-black dark:text-white" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Documents</span>
            </Link>
            <Link href="/clients" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white">
              <Users className="w-5 h-5 text-black dark:text-white" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Clients</span>
            </Link>
            <Link href="/billing" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white">
              <CreditCard className="w-5 h-5 text-black dark:text-white" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Billing</span>
            </Link>
            <Link href="/analytics" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white">
              <BarChart2 className="w-5 h-5 text-black dark:text-white" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Analytics</span>
            </Link>
            <Link href="/help" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white">
              <HelpCircle className="w-5 h-5 text-black dark:text-white" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Help</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white">
              <Settings className="w-5 h-5 text-black dark:text-white" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Settings</span>
            </Link>
          </nav>
          {/* Avatar right after nav, with small margin */}
          <div className="flex flex-col items-center mt-80">
            <button
              onClick={() => router.push('/user-profile')}
              className="focus:outline-none"
              title="View Profile"
            >
              <Avatar
                style={{ width: avatarSize, height: avatarSize, transition: 'width 0.3s, height 0.3s' }}
                className={`border-2 border-blue-500 shadow hover:shadow-lg transition-all duration-300`}
              >
                {isLoading ? (
                  <span className="w-full h-full flex items-center justify-center font-bold text-lg text-gray-400 animate-pulse">--</span>
                ) : (
                  <>
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={user?.fullName || getInitials(user)} className="object-cover w-full h-full rounded-full" />
                    ) : clerkImageUrl ? (
                      <AvatarImage src={clerkImageUrl} alt={user?.fullName || getInitials(user)} className="object-cover w-full h-full rounded-full" />
                    ) : null}
                    <AvatarFallback>
                      <span className="w-full h-full flex items-center justify-center font-bold text-lg text-blue-700">{getInitials(user)}</span>
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
            </button>
            {!collapsed && user && (
              <span className="mt-2 text-xs text-gray-700 font-medium text-center max-w-[120px] truncate dark:text-white">{user.fullName || user.firstName || user.lastName}</span>
            )}
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
} 