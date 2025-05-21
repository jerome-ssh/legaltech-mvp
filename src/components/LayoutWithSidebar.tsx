"use client";
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
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
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';

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

// Memoize the navigation items
const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/matters', icon: Briefcase, label: 'Matters' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/crm', icon: Users, label: 'CRM' },
  { path: '/billing', icon: CreditCard, label: 'Billing' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/help', icon: HelpCircle, label: 'Help' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

// Memoized NavItem component
const NavItem = React.memo(({ 
  item, 
  pathname, 
  collapsed, 
  onNavigate 
}: { 
  item: typeof NAV_ITEMS[0], 
  pathname: string, 
  collapsed: boolean, 
  onNavigate: (path: string) => void 
}) => {
  const Icon = item.icon;
  const isActive = pathname === item.path;
  
  return (
    <button 
      onClick={() => onNavigate(item.path)}
      className={`w-full flex items-center gap-2 text-black dark:text-white font-semibold hover:text-blue-600 transition-colors ${isActive ? 'text-blue-600' : ''}`}
    >
      <Icon className="w-5 h-5" /> 
      <span className={`${collapsed ? "hidden group-hover:block" : "block"}`}>
        {item.label}
      </span>
    </button>
  );
});

NavItem.displayName = 'NavItem';

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { avatarUrl, clerkImageUrl, isLoading: profileIsLoading } = useProfile();
  const colorMode = useContext(ColorModeContext);

  // Memoize handlers
  const handleMouseEnter = useCallback(() => setIsCollapsed(false), []);
  const handleMouseLeave = useCallback(() => setIsCollapsed(true), []);
  const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);

  // Optimized navigation handler with debounce
  const handleNavigation = useCallback(async (path: string) => {
    setIsLoading(true);
    try {
      await router.prefetch(path);
      await router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Memoize user initials
  const userInitials = useMemo(() => {
    if (!user?.fullName && !user?.firstName && !user?.lastName) return '';
    const name = (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`).trim();
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }, [user?.fullName, user?.firstName, user?.lastName]);

  // Memoize avatar component
  const AvatarComponent = useMemo(() => (
    <Avatar
      className={`border-2 border-blue-500 shadow hover:shadow-lg transition-all duration-200`}
      style={{ width: isCollapsed ? 48 : 96, height: isCollapsed ? 48 : 96 }}
    >
      {profileIsLoading ? (
        <span className="w-full h-full flex items-center justify-center font-bold text-lg text-gray-400 animate-pulse">--</span>
      ) : (
        <>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={user?.fullName || userInitials} className="object-cover w-full h-full rounded-full" />
          ) : clerkImageUrl ? (
            <AvatarImage src={clerkImageUrl} alt={user?.fullName || userInitials} className="object-cover w-full h-full rounded-full" />
          ) : null}
          <AvatarFallback>
            <span className="w-full h-full flex items-center justify-center font-bold text-lg text-blue-700">{userInitials}</span>
          </AvatarFallback>
        </>
      )}
    </Avatar>
  ), [avatarUrl, clerkImageUrl, isCollapsed, profileIsLoading, user?.fullName, userInitials]);

  return (
    <div className="flex h-screen">
      <aside
        className={cn(
          'relative flex flex-col border-r bg-background transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <LoadingState size="sm" />
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-10">
            <div className={`text-2xl font-bold text-blue-600 dark:text-white ${isCollapsed ? "hidden group-hover:block" : "block"}`}>LawMate</div>
            <button 
              onClick={toggleCollapse} 
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          <nav className="space-y-6 text-black dark:text-white">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                pathname={pathname}
                collapsed={isCollapsed}
                onNavigate={handleNavigation}
              />
            ))}
          </nav>
          {/* Avatar right after nav, with small margin */}
          <div className="flex flex-col items-center mt-72">
            <button
              onClick={() => handleNavigation('/user-profile')}
              className="focus:outline-none"
              title="View Profile"
            >
              {AvatarComponent}
            </button>
            {!isCollapsed && user && (
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
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
} 