"use client";
import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import {
  LayoutDashboard, FileText, Users, CreditCard, BarChart2, HelpCircle, Settings,
  ChevronLeft, ChevronRight, Sun, Moon, Briefcase
} from "lucide-react";
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import { ColorModeContext } from '@/components/providers/MuiThemeProvider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

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
  const pathname = usePathname();
  const { avatarUrl, clerkImageUrl, isLoading } = useProfile();
  const colorMode = useContext(ColorModeContext);

  // Memoize the collapse handlers
  const handleMouseEnter = useCallback(() => setCollapsed(false), []);
  const handleMouseLeave = useCallback(() => setCollapsed(true), []);
  const toggleCollapse = useCallback(() => setCollapsed(prev => !prev), []);

  // Navigation handler
  const handleNavigation = useCallback((path: string) => {
    if (pathname !== path) {
      router.push(path);
    }
  }, [pathname, router]);

  // Helper to get initials
  const getInitials = useCallback((user: any) => {
    if (!user) return '';
    const first = user.firstName || '';
    const last = user.lastName || '';
    return (first[0] || '') + (last[0] || '');
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`group ${collapsed ? "w-20" : "w-64"} shadow-md p-4 transition-all duration-200 ease-in-out hover:w-64 flex flex-col bg-white dark:bg-[#23315c]`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div>
          <div className="flex items-center justify-between mb-10">
            <div className={`text-2xl font-bold text-blue-600 dark:text-white ${collapsed ? "hidden group-hover:block" : "block"}`}>LawMate</div>
            <button 
              onClick={toggleCollapse} 
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          <nav className="space-y-6 text-black dark:text-white">
            <button 
              onClick={() => handleNavigation('/dashboard')}
              className={`w-full flex items-center gap-2 text-black dark:text-white font-semibold hover:text-blue-600 transition-colors ${pathname === '/dashboard' ? 'text-blue-600' : ''}`}
            >
              <LayoutDashboard className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Dashboard</span>
            </button>
            <button 
              onClick={() => handleNavigation('/matters')}
              className={`w-full flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white transition-colors ${pathname === '/matters' ? 'text-blue-600' : ''}`}
            >
              <Briefcase className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Matters</span>
            </button>
            <button 
              onClick={() => handleNavigation('/documents')}
              className={`w-full flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white transition-colors ${pathname === '/documents' ? 'text-blue-600' : ''}`}
            >
              <FileText className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Documents</span>
            </button>
            <button 
              onClick={() => handleNavigation('/crm')}
              className={`w-full flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white transition-colors ${pathname === '/crm' ? 'text-blue-600' : ''}`}
            >
              <Users className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>CRM</span>
            </button>
            <button 
              onClick={() => handleNavigation('/billing')}
              className={`w-full flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white transition-colors ${pathname === '/billing' ? 'text-blue-600' : ''}`}
            >
              <CreditCard className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Billing</span>
            </button>
            <button 
              onClick={() => handleNavigation('/analytics')}
              className={`w-full flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white transition-colors ${pathname === '/analytics' ? 'text-blue-600' : ''}`}
            >
              <BarChart2 className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Analytics</span>
            </button>
            <button 
              onClick={() => handleNavigation('/help')}
              className={`w-full flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white transition-colors ${pathname === '/help' ? 'text-blue-600' : ''}`}
            >
              <HelpCircle className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Help</span>
            </button>
            <button 
              onClick={() => handleNavigation('/settings')}
              className={`w-full flex items-center gap-2 hover:text-blue-600 cursor-pointer text-black dark:text-white transition-colors ${pathname === '/settings' ? 'text-blue-600' : ''}`}
            >
              <Settings className="w-5 h-5" /> <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>Settings</span>
            </button>
          </nav>
          {/* Avatar right after nav, with small margin */}
          <div className="flex flex-col items-center mt-72">
            <button
              onClick={() => handleNavigation('/user-profile')}
              className="focus:outline-none"
              title="View Profile"
            >
              <Avatar
                className={`border-2 border-blue-500 shadow hover:shadow-lg transition-all duration-200`}
                style={{ width: collapsed ? 48 : 96, height: collapsed ? 48 : 96 }}
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
            {/* Theme Toggle Button under avatar */}
            <div className="mt-6 flex justify-center w-full">
              <Tooltip title={colorMode.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton
                  onClick={colorMode.toggleColorMode}
                  aria-label="Toggle theme"
                  size="large"
                  sx={{
                    border: '1px solid #e0e0e0',
                    background: colorMode.mode === 'dark' ? '#22223b' : '#fff',
                    transition: 'background 0.2s',
                  }}
                >
                  {colorMode.mode === 'dark' ? (
                    <Sun className="w-7 h-7 text-yellow-400" />
                  ) : (
                    <Moon className="w-7 h-7 text-blue-700" />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
} 