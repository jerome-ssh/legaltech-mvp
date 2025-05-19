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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import dynamic from 'next/dynamic';
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import MuiButton from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import MuiCardContent from '@mui/material/CardContent';

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
  completed: boolean;
}

interface DashboardData {
  openCases: number;
  deadlines: number;
  unreadMessages: number;
  billingAmount: number;
  activity: Activity[];
  tasks: Task[];
}

interface HistoryEntry {
  question: string;
  response: string;
}

interface CaseStage {
  id: string;
  stage: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  client_name: string;
  client_img: string;
  progress: number;
}

const useCases = [
  { icon: FileQuestion, label: "Document Review" },
  { icon: Scale, label: "Legal Research" },
  { icon: Gavel, label: "Case Analysis" },
  { icon: Briefcase, label: "Contract Review" },
  { icon: FileCheck, label: "Compliance Check" },
];

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    openCases: 0,
    deadlines: 0,
    unreadMessages: 0,
    billingAmount: 0,
    activity: [],
    tasks: []
  });
  const [prompt, setPrompt] = useState("");
  const [fileName, setFileName] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [caseStages, setCaseStages] = useState<CaseStage[]>([]);
  const [loading, setLoading] = useState(true);

  // Clerk authentication check
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ count: openCases }, { count: deadlines }, { count: unreadMessages }, { data: billingData }, { data: activityData }, { data: tasksData }] = await Promise.all([
          supabase.from("cases").select("id", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("deadlines").select("id", { count: "exact", head: true }).gt("due_date", new Date().toISOString()),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
          supabase.from("billing").select("amount").order("created_at", { ascending: false }).limit(1),
          supabase.from("activity").select("description,created_at").order("created_at", { ascending: false }).limit(3),
          supabase.from("tasks").select("title,completed").order("created_at", { ascending: false }).limit(3),
        ]);

        setDashboardData({
          openCases: openCases ?? 0,
          deadlines: deadlines ?? 0,
          unreadMessages: unreadMessages ?? 0,
          billingAmount: billingData?.[0]?.amount || 0,
          activity: activityData || [],
          tasks: tasksData || []
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchCaseStages() {
      try {
        const { data, error } = await supabase
          .from('case_stages')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          // If table doesn't exist, use sample data
          setCaseStages([
            {
              id: '1',
              stage: 'Initial Consultation',
              due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              priority: 'High',
              client_name: 'John Doe',
              client_img: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
              progress: 30
            },
            {
              id: '2',
              stage: 'Document Review',
              due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              priority: 'Medium',
              client_name: 'Jane Smith',
              client_img: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
              progress: 60
            },
            {
              id: '3',
              stage: 'Court Filing',
              due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              priority: 'Low',
              client_name: 'Mike Johnson',
              client_img: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=random',
              progress: 90
            }
          ]);
          return;
        }

        setCaseStages(data || []);
      } catch (error) {
        console.error('Error fetching case stages:', error);
        // Use sample data in case of any error
        setCaseStages([
          {
            id: '1',
            stage: 'Initial Consultation',
            due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'High',
            client_name: 'John Doe',
            client_img: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
            progress: 30
          },
          {
            id: '2',
            stage: 'Document Review',
            due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'Medium',
            client_name: 'Jane Smith',
            client_img: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
            progress: 60
          },
          {
            id: '3',
            stage: 'Court Filing',
            due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'Low',
            client_name: 'Mike Johnson',
            client_img: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=random',
            progress: 90
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchCaseStages();
  }, []);

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
                    <p className="text-sm text-gray-500">Open Cases</p>
                    <p className="text-xl font-bold">{dashboardData.openCases}</p>
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
                    <p className="text-xl font-bold">${dashboardData.billingAmount}</p>
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
                      <input type="checkbox" className="accent-blue-600" checked={t.completed} readOnly /> {t.title}
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
                  {useCases.map(({ icon: Icon, label }) => (
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
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Case Status Tracker</h2>
          <div className="space-y-6 max-h-[33vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : caseStages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No cases found</div>
            ) : (
              caseStages.map(({ id, stage, due, priority, client_name, client_img, progress }, index) => (
                <div
                  key={id}
                  className="relative flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-white to-blue-50 border hover:shadow-lg transition duration-200"
                >
                  <img
                    src={client_img}
                    alt={client_name}
                    className="w-12 h-12 rounded-full border-2 border-blue-200 shadow-sm"
                  />
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">{stage}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(due).toLocaleDateString()} • Priority: {" "}
                      <span
                        className={`font-semibold ${priority === "High"
                          ? "text-red-500"
                          : priority === "Medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                          }`}
                      >
                        {priority}
                      </span>
                    </p>
                    <div className="h-2 mt-2 rounded bg-gray-200">
                      <div
                        className={`h-2 rounded ${getProgressColor(priority)} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <Info className="w-4 h-4" /> Tip: Hover for more info
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