"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Settings,
  Bell,
  MessageSquare,
  CalendarCheck,
  FolderOpen,
  Plus,
  BarChart2,
  HelpCircle,
  MapPin,
  UserCircle2,
  Globe,
  PieChart,
  Smile,
  ChevronLeft,
  ChevronRight,
  Bot,
  FileQuestion,
  Scale,
  Gavel,
  Briefcase,
  FileCheck,
  Mic,
  MicOff,
  Info,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import dynamic from 'next/dynamic';
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import MuiButton from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import MuiCardContent from '@mui/material/CardContent';
import { ProgressBar } from '@/components/matters/ProgressBar';
import { MatterProgress } from '@/types/matter';

const TopBar = dynamic(() => import('@/components/TopBar'), {
  ssr: false,
  loading: () => <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

const HeaderBar = dynamic(() => import('@/components/HeaderBar'), {
  ssr: false,
  loading: () => <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

interface Activity {
  description: string;
  created_at: string;
}

interface Task {
  title: string;
  status: string;
  completed_at: string | null;
}

interface DashboardData {
  openMatters: number;
  deadlines: number;
  unreadMessages: number;
  billing: {
    paid: number;
    outstanding: number;
  };
  activity: any[];
  tasks: any[];
}

interface HistoryEntry {
  question: string;
  response: string;
}

interface MatterStage {
  id: string;
  title: string;
  status: string;
  due_date: string;
  priority: string;
  client_name: string;
  client_avatar_url: string;
  progress: MatterProgress | null;
}

interface Client {
  name: string;
  avatar_url: string;
}

interface Matter {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  clients: Client;
}

interface MatterWithClient {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  clients: { name: string; avatar_url: string } | { name: string; avatar_url: string }[];
  progress: MatterProgress | null;
}

const useMatters = [
  {
    icon: FileText,
    label: "All Matters",
    href: "/dashboard/matters",
  },
  {
    icon: FileText,
    label: "Open Matters",
    href: "/dashboard/matters?status=open",
  },
  {
    icon: FileText,
    label: "Closed Matters",
    href: "/dashboard/matters?status=closed",
  },
  {
    icon: FileText,
    label: "My Matters",
    href: "/dashboard/matters?assigned=me",
  },
];

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    openMatters: 0,
    deadlines: 0,
    unreadMessages: 0,
    billing: {
      paid: 0,
      outstanding: 0,
    },
    activity: [],
    tasks: [],
  });
  const [prompt, setPrompt] = useState("");
  const [fileName, setFileName] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [matterStages, setMatterStages] = useState<MatterStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clerk authentication check
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function fetchDashboardData() {
      try {
        if (!user) {
          throw new Error('No authenticated user');
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        const profileId = profile ? profile.id : 'default';
        if (!profile) {
          console.warn('Profile not found, using default profile ID');
        }

        const [{ count: openMatters }, { count: deadlines }, { count: unreadMessages }, { data: billingData }, { data: activityData }, { data: tasksData }] = await Promise.all([
          supabase.from("matters").select("id", { count: "exact", head: true }).eq("status", "open").eq("profile_id", profileId),
          supabase.from("deadlines").select("id", { count: "exact", head: true }).eq("profile_id", profileId),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("profile_id", profileId).eq("is_read", false),
          supabase.from("billing").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(1),
          supabase.from("activity_log").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(5),
          supabase.from("tasks").select("*").eq("profile_id", profileId).order("due_date", { ascending: true }).limit(5),
        ]);

        setDashboardData({
          openMatters: openMatters ?? 0,
          deadlines: deadlines ?? 0,
          unreadMessages: unreadMessages ?? 0,
          billing: billingData?.[0] || { paid: 0, outstanding: 0 },
          activity: activityData || [],
          tasks: tasksData || [],
        });
      } catch (err) {
        // Enhanced debugging: log error to server terminal via API and UI
        const errorMsg = '[Dashboard Summary] ' + (err instanceof Error ? err.message : String(err));
        // Send error to server terminal
        fetch('/api/log-client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: errorMsg, stack: err instanceof Error ? err.stack : '' }),
        });
        setError(errorMsg);
        setDashboardData({
          openMatters: 0,
          deadlines: 0,
          unreadMessages: 0,
          billing: {
            paid: 0,
            outstanding: 0,
          },
          activity: [],
          tasks: [],
        });
      } finally {
        setLoading(false);
      }
    }

    async function fetchMatterStages() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/dashboard/matters-tracker');
        if (!res.ok) {
          const errData = await res.json();
          setError(errData.error || 'Failed to fetch matters');
          setMatterStages([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setMatterStages(data.matters || []);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch matters');
        setMatterStages([]);
        setLoading(false);
      }
    }

    fetchDashboardData();
    fetchMatterStages();
  }, [isLoaded, isSignedIn]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        // Here you would typically send the audio blob to your speech-to-text service
        // For now, we'll just simulate a response
        setPrompt("Transcribed audio: [Your speech-to-text service would convert the audio to text here]");
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handlePrompt = async () => {
    if (!prompt.trim()) return;

    // Add the question to history immediately
    const newEntry: HistoryEntry = {
      question: prompt,
      response: "Processing your request..." // Placeholder response
    };
    setHistory(prev => [newEntry, ...prev]);
    setPrompt("");

    // Here you would typically make an API call to your AI service
    // For now, we'll just simulate a response
    setTimeout(() => {
      setHistory(prev => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          response: "This is a simulated response. In a real implementation, this would be the AI's response to your query."
        };
        return updated;
      });
    }, 1000);
  };

  const getProgressColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <main className="flex-1 p-8">
        <HeaderBar />

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : (
            <>
              <Card className="shadow-md bg-gradient-to-br from-white via-blue-50 to-pink-100/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <FolderOpen className="text-blue-500 w-6 h-6" />
                  <div>
                    <p className="text-sm text-gray-500">Open Matters</p>
                    <p className="text-xl font-bold">{dashboardData.openMatters}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-md bg-gradient-to-br from-white via-blue-50 to-pink-100/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <CalendarCheck className="text-green-500 w-6 h-6" />
                  <div>
                    <p className="text-sm text-gray-500">Upcoming Deadlines</p>
                    <p className="text-xl font-bold">{dashboardData.deadlines}</p>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="shadow-md bg-gradient-to-br from-white via-blue-50 to-pink-100/50 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => router.push('/crm?tab=messages')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <MessageSquare className="text-yellow-500 w-6 h-6" />
                  <div>
                    <p className="text-sm text-gray-500">Unread Messages</p>
                    <p className="text-xl font-bold">{dashboardData.unreadMessages}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-md bg-gradient-to-br from-white via-blue-50 to-pink-100/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <CreditCard className="text-red-500 w-6 h-6" />
                  <div>
                    <p className="text-sm text-gray-500">Billing Status</p>
                    <p className="text-xl font-bold">${dashboardData.billing.paid} / ${dashboardData.billing.outstanding}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-1 shadow-md bg-gradient-to-br from-white via-blue-50 to-pink-100/50">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              {loading ? (
                <>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                </>
              ) : (() => {
                const activity = Array.isArray(dashboardData.activity) ? dashboardData.activity : [];
                return (
                  <ul className="space-y-3 text-sm text-gray-600">
                    {activity.length === 0 && <li>No activity yet.</li>}
                    {activity.map((a: Activity, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span> {a.description}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="lg:col-span-1 shadow-md bg-gradient-to-br from-white via-blue-50 to-pink-100/50">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
              {loading ? (
                <>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                </>
              ) : (
                <ul className="space-y-3 text-sm text-gray-700">
                  {dashboardData.tasks.length === 0 && <li>No tasks yet.</li>}
                  {dashboardData.tasks.map((t: Task, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="accent-blue-600" 
                        checked={t.status === 'completed'} 
                        readOnly 
                      /> 
                      {t.title}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* AI Assistant Panel */}
          <Card className="lg:col-span-1 shadow-md bg-gradient-to-br from-white via-blue-50 to-pink-100/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="text-blue-500" />
                <h2 className="text-xl font-semibold">AI Assistant</h2>
              </div>
              <div className="relative">
                <Textarea
                  rows={5}
                  placeholder="Ask something legal..."
                  value={prompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                  className="mb-3 pr-20 resize-none text-base w-full bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200"
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-1 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'text-blue-600 hover:text-blue-800'}`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>
              {fileName && <p className="text-sm mb-2 text-gray-700">Uploaded: {fileName}</p>}
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-2 flex-wrap">
                  {useMatters.map(({ icon: Icon, label }) => (
                    <Button
                      key={label}
                      size="sm"
                      variant="outline"
                      className={`gap-1 transition-colors duration-200 ${selectedUseCase === label
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                        : 'bg-white border-0 shadow-sm hover:bg-blue-50'
                        }`}
                      onClick={() => setSelectedUseCase(selectedUseCase === label ? null : label)}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </Button>
                  ))}
                </div>
                <Button onClick={handlePrompt} size="sm" className="bg-blue-600 text-white shadow-sm">
                  Ask
                </Button>
              </div>
              <div className="text-sm text-gray-700 max-h-32 overflow-y-auto space-y-1">
                {history.map((entry, index) => (
                  <div key={index} className="p-2 rounded bg-white shadow-sm">
                    <p className="font-semibold">Q: {entry.question}</p>
                    <p className="text-blue-600">A: {entry.response}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Tracker Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100 mt-4 animate-fade-in">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Matter Status Tracker</h2>
          <div className="space-y-4 max-h-[33vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                <div>Failed to load tracker data:</div>
                <div className="font-mono text-xs break-all whitespace-pre-wrap">{typeof error === 'string' ? error : JSON.stringify(error, null, 2)}</div>
              </div>
            ) : matterStages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No matters found. (If you see a demo matter below, this is for visual confirmation only.)</div>
            ) : (
              matterStages.map(({ id, title, status, due_date, priority, client_name, client_avatar_url, progress }, index) => (
                <div
                  key={id}
                  className="relative flex items-center gap-4 p-4 mb-4 rounded-lg bg-gradient-to-r from-white to-blue-50 border hover:shadow-lg transition duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 min-w-0 mb-1">
                      {client_avatar_url ? (
                        <img
                          src={client_avatar_url}
                          alt={client_name}
                          className="w-12 h-12 rounded-full border-2 border-blue-200 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-blue-200 shadow-sm flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg uppercase">
                          {client_name
                            .split(' ')
                            .map(word => word[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                      )}
                      <div className="ml-2 flex items-center gap-2 min-w-0 w-full">
                        <span className="text-base font-medium text-gray-900 truncate max-w-[120px]" title={client_name}>{client_name}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-sm text-gray-500 whitespace-nowrap">Matter Title:</span>
                        <span className="text-base font-semibold text-gray-800 truncate ml-1" title={title}>{title}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Status: <span className="font-semibold">{status}</span> • Due: {due_date ? new Date(due_date).toLocaleDateString() : 'N/A'} • Priority:{" "}
                      <span
                        className={`font-semibold ${priority === "High"
                          ? "text-red-500"
                          : priority === "Medium"
                            ? "text-yellow-500"
                            : priority === "Low"
                              ? "text-green-500"
                              : "text-blue-500"
                          }`}
                      >
                        {priority}
                      </span>
                    </p>
                    <div className="my-2 cursor-pointer group" onClick={() => router.push(`/matters/${id}`)} title="View Matter Details">
                      <ProgressBar compact progress={progress || { overall: 0, by_stage: {}, completed_tasks: 0, total_tasks: 0, completed_weight: 0, total_weight: 0 }} />
                      <span className="block text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1">Go to Matter Details</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}