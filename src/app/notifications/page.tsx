'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Task } from '@/types/matter';
import { toast } from 'sonner';
import { Sparkles, Bell, Bot } from 'lucide-react';

const LayoutWithSidebar = dynamic(() => import('@/components/LayoutWithSidebar'), {
  ssr: false,
  loading: () => <div className="h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Task[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data.notifications);
      } catch (error) {
        toast.error('Failed to load notifications');
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <LayoutWithSidebar>
      <div className="relative min-h-screen flex flex-col items-center justify-start py-12 px-2 sm:px-0 bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-[#1a2540] dark:via-[#23315c] dark:to-[#5a7bd7]">
        {/* AI Assistant Floating Card */}
        <div className="absolute top-8 right-8 z-10 hidden md:block animate-fade-in">
          <div className="backdrop-blur-xl bg-white/60 dark:bg-[#232f4b]/60 border border-blue-100 dark:border-blue-900 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-3">
            <Bot className="w-8 h-8 text-pink-400 animate-bounce-slow" />
            <div>
              <div className="font-bold text-blue-700 dark:text-pink-300 text-lg flex items-center gap-1">
                <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
                LawMate AI
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                Your notifications are analyzed in real-time for legal insights and deadlines.
              </div>
            </div>
          </div>
        </div>

        {/* Main Notification Card */}
        <div className="w-full max-w-2xl mx-auto mt-8">
          <div className="rounded-3xl shadow-2xl border border-blue-100 dark:border-blue-900 bg-white/80 dark:bg-[#232f4b]/80 backdrop-blur-xl p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-sky-400/30 via-pink-400/20 to-transparent rounded-full blur-2xl z-0" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-8 h-8 text-sky-400 animate-pulse" />
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-pink-400 bg-clip-text text-transparent tracking-tight">Notifications</h1>
              </div>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Bot className="w-16 h-16 text-pink-400 animate-bounce-slow mb-4" />
                  <p className="text-lg font-semibold text-gray-500 dark:text-gray-300 mb-2">No notifications</p>
                  <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">You're all caught up! LawMate AI will alert you to any important updates, deadlines, or legal insights here.</p>
                  <button className="px-6 py-2 rounded-full bg-gradient-to-r from-sky-400 to-pink-400 text-white font-bold shadow-lg hover:scale-105 transition-transform">Ask LawMate AI</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((task, idx) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-white/80 via-blue-50/80 to-pink-50/80 dark:from-[#232f4b]/80 dark:via-[#23315c]/80 dark:to-[#5a7bd7]/80 border border-blue-100 dark:border-blue-900 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-sky-400/10 to-pink-400/10 rounded-full blur-2xl z-0 group-hover:scale-110 transition-transform" />
                      <div className="relative z-10 flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700 dark:text-pink-300 text-lg">{task.label}</span>
                          {(task as any).due_date && (
                            <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-sky-100 to-pink-100 text-blue-700 dark:text-pink-300 border border-blue-200 dark:border-pink-400 animate-pulse">
                              Due: {new Date((task as any).due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 dark:text-gray-300 text-sm mt-1">
                          {(task as any).description || 'No additional details.'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-400">AI Priority: <span className="font-bold text-pink-400">{['High','Medium','Low'][idx%3]}</span></span>
                        <button className="px-3 py-1 rounded-full bg-gradient-to-r from-sky-400 to-pink-400 text-white text-xs font-bold shadow hover:scale-105 transition-transform">View</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
} 