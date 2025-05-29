// NOTE: 'case' = 'matter' in UI/UX/backend
// This file handles individual matter detail pages

'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  BellIcon,
  ClockIcon,
  FolderIcon,
  StarIcon,
  UserIcon,
  DownloadIcon,
  FileTextIcon,
  RefreshCcwIcon,
  MessageCircleIcon,
  FilePlus2Icon,
  BotIcon,
  HistoryIcon,
  CheckCircle2Icon,
  FileSearch2Icon,
  FileSignatureIcon,
  BookOpenIcon,
  LightbulbIcon,
  SendIcon,
  ArrowLeft,
  XIcon,
  DollarSign,
  Loader2,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  MapPin,
  Plus,
  Trash2,
  Save,
  CalendarDays,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { getCountryNameByCode } from '@/lib/geo-data';
import { ProgressBar } from '@/components/matters/ProgressBar';
import { MatterAIAssistantPrompt } from '@/components/matters/MatterAIAssistantPrompt';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { TaskList } from '@/components/matters/TaskList';

const LayoutWithSidebar = dynamic(() => import('@/components/LayoutWithSidebar'), {
  ssr: false,
  loading: () => <div className="h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

interface Matter {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: { id: string; name: string } | null;
  client_name?: string;
  created_at: string;
  updated_at: string;
  matter_status?: {
    status: string;
    changed_at: string;
    notes?: string;
    changed_by?: string;
  }[];
  matter_billing?: any;
  matter_intake_links?: any[];
  matter_type?: string;
  matter_sub_type?: string;
  applied_template_id?: number | null;
  client?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    tags?: string[];
    date_of_birth?: string;
    title?: { id: string; label: string };
    client_type?: { id: string; label: string };
    preferred_language?: { id: string; label: string };
  };
  tags?: string[];
  progress?: any;
  assigned_to?: string;
  estimated_value?: number;
  jurisdiction?: string;
  deadline?: string;
}

const getPriorityColor = (priority?: { id: string; name: string } | null) => {
  if (!priority || typeof priority !== 'object') return 'bg-gray-100 text-gray-800';
  switch (priority.name.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status?: string) => {
  if (!status || typeof status !== 'string') return 'bg-gray-100 text-gray-800';
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function MatterDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUser();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);
  const [templateApplied, setTemplateApplied] = useState(false);
  const [showCustomTaskList, setShowCustomTaskList] = useState(false);
  const tasksTabRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchMatter = async () => {
      try {
        const res = await fetch(`/api/matters/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch matter');
        const data = await res.json();
        setMatter(data.matter);
        setLoading(false);
      } catch (e) {
        setError('Failed to load matter details');
        setLoading(false);
      }
    };

    fetchMatter();
  }, [params.id]);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    const taskId = searchParams?.get('taskId');
    if (tab === 'tasks') {
      setActiveTab('tasks');
      // Wait for the tab to render, then scroll to the task
      setTimeout(() => {
        if (taskId) {
          const el = document.getElementById(`task-${taskId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');
            }, 2000);
          }
        }
      }, 500);
    }
  }, [searchParams]);

  // Demo AI/insights/activity data (replace with real AI endpoints in future)
  const insights = {
    retention: "92% HIGH",
    billing: "$275 / hr (AI‑benchmarked)",
    complexity: "High (57 docs, 120+ msgs)",
    winProb: "83%",
  };
  const activityTrend = [
    { week: "W1", tasks: 3 },
    { week: "W2", tasks: 6 },
    { week: "W3", tasks: 5 },
    { week: "W4", tasks: 9 },
  ];

  // Micro-interaction: Animate confetti/checkmark on key actions
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  // AI chat send handler (scaffold)
  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiMessages((msgs) => [...msgs, { role: "user", content: aiInput }]);
    setAiInput("");
    // Simulate AI response
    setTimeout(() => {
      setAiMessages((msgs) => [...msgs, { role: "ai", content: "[AI] This is a simulated response. Real AI coming soon!" }]);
      setAiLoading(false);
    }, 1200);
  };

  // Fetch curated template for review
  const fetchTemplate = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const res = await fetch(`/api/matter-templates/by-matter/${params.id}`);
      const data = await res.json();
      if (data.template) {
        setTemplate(data.template);
        setReviewTasks(data.template.tasks.map((t: any) => ({ ...t, due_date: t.due_date || '' })));
        setReviewMode(true);
        setTemplateApplied(false);
      } else if (data.applied_template_id) {
        setTemplateApplied(true);
        setReviewMode(false);
      } else {
        setTemplate(null);
        setReviewMode(false);
        toast({ title: 'No template found for this matter.', variant: 'destructive' });
      }
    } catch (e) {
      setTemplate(null);
      setReviewMode(false);
      toast({ title: 'Failed to fetch template', variant: 'destructive' });
    } finally {
      setTemplateLoading(false);
    }
  }, [params.id]);

  // Handler for AI prompt or button click
  const handleUseTemplate = () => {
    fetchTemplate();
  };

  // Handler for applying reviewed tasks
  const handleApplyTemplate = async () => {
    try {
      const res = await fetch(`/api/matter-templates/apply/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }) // Remove tasks: reviewTasks for now
      });
      if (!res.ok) throw new Error('Failed to apply template');
      setTemplateApplied(true);
      setReviewMode(false);
      toast({ title: 'Template applied!', variant: 'default' });
      fetchTemplate(); // Refresh state
    } catch (e) {
      toast({ title: 'Failed to apply template', variant: 'destructive' });
    }
  };

  // Handlers for review task editing
  const handleEditTask = (idx: number, field: string, value: any) => {
    setReviewTasks(tasks => tasks.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };
  const handleDeleteTask = (idx: number) => {
    setReviewTasks(tasks => tasks.filter((_, i) => i !== idx));
  };
  const handleAddTask = () => {
    setReviewTasks(tasks => [...tasks, { label: '', stage: 'Active Work', weight: 1, status: 'Not Started', due_date: '' }]);
  };
  // Calendar integration (placeholder)
  const handleAddToCalendar = (idx: number) => {
    toast({ title: 'Calendar integration coming soon!', variant: 'default' });
  };

  // Custom task list creation
  const handleCreateCustomTaskList = () => {
    setShowCustomTaskList(true);
    setReviewTasks([{ label: '', stage: 'Active Work', weight: 1, status: 'Not Started', due_date: '' }]);
    setReviewMode(true);
    setTemplate(null);
  };
  const handleApplyCustomTasks = async () => {
    try {
      const res = await fetch(`/api/matter-templates/custom/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: reviewTasks })
      });
      if (!res.ok) throw new Error('Failed to create custom tasks');
      setTemplateApplied(true);
      setReviewMode(false);
      setShowCustomTaskList(false);
      toast({ title: 'Custom tasks created!', variant: 'default' });
      fetchTemplate(); // Refresh state
    } catch (e) {
      toast({ title: 'Failed to create custom tasks', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <LayoutWithSidebar>
        <div className="p-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  if (!matter) {
    return (
      <LayoutWithSidebar>
        <div className="p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Matter Not Found</h2>
            <p className="text-gray-600 mb-6">The matter you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/matters')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matters
            </Button>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  // Compose client name and initials
  const clientName = matter.client ? `${matter.client.first_name || ''} ${matter.client.last_name || ''}`.trim() : 'Unknown';
  const clientInitials = matter.client ? `${matter.client.first_name?.[0] || ''}${matter.client.last_name?.[0] || ''}`.toUpperCase() : '??';
  const priority = matter.priority?.name || 'Unspecified';
  const status = matter.matter_status?.[0]?.status || matter.status || 'Unspecified';
  const tags = matter.tags || [];
  const progress = matter.progress || 0;
  const team = matter.assigned_to || 'Unassigned';
  const value = matter.estimated_value ? `$${matter.estimated_value.toLocaleString()}` : 'N/A';
  const jurisdiction = getCountryNameByCode(matter.jurisdiction || '') || matter.jurisdiction || 'N/A';
  const deadline = matter.deadline ? String(matter.deadline) : 'No deadline';
  const type = matter.matter_type || 'N/A';
  const subtype = matter.matter_sub_type || 'N/A';
  const created = matter.created_at ? new Date(matter.created_at).toLocaleDateString() : 'N/A';
  const updated = matter.updated_at ? new Date(matter.updated_at).toLocaleDateString() : 'N/A';

  return (
    <LayoutWithSidebar>
      {/* AI Assistant Prompt for template suggestion */}
      {matter && (
        <MatterAIAssistantPrompt
          matterId={matter.id}
          appliedTemplateId={typeof matter.applied_template_id === 'number' ? matter.applied_template_id : null}
          userFirstName={user?.firstName ?? undefined}
          onTemplateApplied={async () => {
            // Refetch matter data after template is applied
            setLoading(true);
            try {
              const res = await fetch(`/api/matters/${params.id}`);
              if (!res.ok) throw new Error('Failed to fetch matter');
              const data = await res.json();
              setMatter(data.matter);
            } catch (e) {
              setError('Failed to load matter details');
            }
            setLoading(false);
          }}
        />
      )}
      <div className="min-h-screen w-full font-sans relative bg-background text-foreground">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border shadow-sm flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary tracking-tight drop-shadow-sm">{matter.title}</h1>
            <Badge className="bg-blue-500/10 text-blue-500 font-semibold animate-pulse">{status}</Badge>
            <Badge className={getPriorityColor(matter.priority)}>Priority: {priority}</Badge>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAiPanelOpen(true)}
                title="AI Assistant"
                className="bg-blue-600/90 hover:bg-blue-700 text-white rounded-full shadow focus:ring-2 focus:ring-blue-400"
              >
                <BotIcon className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Add Document"
                className="bg-green-600/90 hover:bg-green-700 text-white rounded-full shadow focus:ring-2 focus:ring-green-400"
              >
                <FilePlus2Icon className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Add Task"
                className="bg-yellow-500/90 hover:bg-yellow-600 text-white rounded-full shadow focus:ring-2 focus:ring-yellow-300"
              >
                <CheckCircle2Icon className="w-5 h-5" />
              </Button>
          <Button
            variant="ghost"
                size="icon"
                title="Back to Matters"
            onClick={() => router.push('/matters')}
                className="bg-gray-500/90 hover:bg-gray-600 text-white rounded-full shadow focus:ring-2 focus:ring-gray-400"
          >
                <ArrowLeft className="w-5 h-5" />
          </Button>
            </div>
          </div>
        </div>

        {/* Floating AI Panel */}
        {aiPanelOpen && (
          <div className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-white/90 shadow-2xl border-l border-blue-200 flex flex-col animate-slide-in-from-right rounded-l-2xl" style={{backdropFilter: 'blur(16px)'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white/80 rounded-tl-2xl">
              <div className="flex items-center gap-2">
                <BotIcon className="w-6 h-6 text-blue-500 animate-bounce" />
                <span className="font-bold text-blue-700 text-lg">AI Assistant</span>
                </div>
              <Button variant="ghost" size="icon" onClick={() => setAiPanelOpen(false)} aria-label="Close AI Panel"><XIcon className="w-5 h-5 text-blue-400" /></Button>
                </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="flex-1 flex flex-col gap-2">
                {aiMessages.length === 0 && !aiLoading && (
                  <div className="text-slate-500 text-center mt-20">Ask anything about this matter, draft a contract, or run legal research…</div>
                )}
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`rounded-xl px-4 py-2 max-w-[90%] ${msg.role === 'user' ? 'bg-blue-100 self-end text-right' : 'bg-gradient-to-tr from-blue-50 via-white to-blue-100 self-start text-left border border-blue-100'}`}>{msg.content}</div>
                ))}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-blue-400 animate-pulse"><Loader2 className="w-4 h-4 animate-spin" /> AI is thinking…</div>
                )}
              </div>
              <form className="flex gap-2 mt-4" onSubmit={e => { e.preventDefault(); handleAiSend(); }}>
                <input
                  className="flex-1 rounded-xl border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 text-slate-900 placeholder:text-slate-400 transition-shadow"
                  placeholder="Type your request… (e.g., Draft NDA, Summarize, Find Precedent)"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  aria-label="Ask AI"
                  disabled={aiLoading}
                />
                <Button type="submit" variant="default" size="icon" disabled={aiLoading || !aiInput.trim()} aria-label="Send to AI">
                  {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Confetti/Checkmark animation for key actions */}
        {showConfetti && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-tr from-green-200 via-blue-200 to-pink-200 rounded-full p-8 animate-pop-in">
              <CheckCircle2Icon className="w-16 h-16 text-green-500 animate-bounce" />
            </div>
          </div>
        )}

        <div className="max-w-full mx-auto px-2 sm:px-4 py-8">
          {/* Main Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Client Details */}
            <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
              <h2 className="text-primary text-lg font-semibold mb-3">Client Details</h2>
              <div className="flex items-center gap-4 mb-4">
                {matter.client?.avatar_url ? (
                  <img src={matter.client.avatar_url} alt="Client Avatar" className="w-16 h-16 rounded-full border border-blue-200 shadow-sm object-cover" />
                ) : (
                  <Avatar className="w-16 h-16 text-xl flex items-center justify-center rounded-full ring-2 ring-blue-300 shadow-lg animate-pulse bg-gradient-to-br from-blue-100 via-white to-blue-200">{clientInitials}</Avatar>
                )}
                <div>
                  <div className="font-bold text-xl text-foreground leading-tight">{clientName}</div>
                  {matter.client?.tags && matter.client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {matter.client.tags.map((tag: string) => (
                        <Badge key={tag} className="bg-pink-500/10 text-pink-400 text-xs px-2 py-0.5 rounded-full">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Title:</span>
                  <span>{matter.client?.title?.label || <span className='text-muted-foreground'>N/A</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MailIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Email:</span>
                  <span>{matter.client?.email || <span className='text-muted-foreground'>N/A</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Phone:</span>
                  <span>{matter.client?.phone_number || <span className='text-muted-foreground'>N/A</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Language:</span>
                  <span>{matter.client?.preferred_language?.label || <span className='text-muted-foreground'>N/A</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Client Type:</span>
                  <span>{matter.client?.client_type?.label || <span className='text-muted-foreground'>N/A</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Date of Birth:</span>
                  <span>{matter.client?.date_of_birth ? new Date(matter.client.date_of_birth).toLocaleDateString() : <span className='text-muted-foreground'>N/A</span>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Address:</span>
                  <span>{matter.client?.address || <span className='text-muted-foreground'>N/A</span>}</span>
                </div>
              </div>
            </Card>

            {/* Matter Information */}
            <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
              <h2 className="text-primary text-lg font-semibold mb-3">Matter Information</h2>
              <p className="text-muted-foreground flex items-center">
                <FolderIcon className="inline mr-2" size={16}/>
                <span className="font-bold text-foreground">{type}</span>
                {subtype && subtype !== 'N/A' && (
                  <span className="text-xs text-muted-foreground ml-1">({subtype})</span>
                )}
              </p>
              <p className="text-muted-foreground"><UserIcon className="inline mr-2" size={16}/>Team Lead: {team}</p>
              <p className="text-muted-foreground"><ClockIcon className="inline mr-2" size={16}/>Created: {created}</p>
              <p className="text-muted-foreground"><ClockIcon className="inline mr-2" size={16}/>Updated: {updated}</p>
              <p className="text-muted-foreground"><StarIcon className="inline mr-2" size={16}/>Estimated Value: {value}</p>
              <p className="text-muted-foreground"><BellIcon className="inline mr-2" size={16}/>Jurisdiction: {jurisdiction}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.length > 0 ? tags.map((tag: string) => (
                  <Badge key={tag} className="bg-pink-500/10 text-pink-400">{tag}</Badge>
                )) : <span className="text-xs text-muted-foreground">No tags</span>}
              </div>
            </Card>

            {/* Matter Progress */}
            <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
              <h2 className="text-primary text-lg font-semibold mb-3">Matter Progress</h2>
              <ProgressBar progress={matter.progress || {}} />
              <p className="text-xs text-muted-foreground mt-1">{(matter.progress?.overall ?? 0)}% Complete</p>
              <p className="text-xs text-red-500 mt-2">Next Task: {deadline}</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button size="sm" variant="outline"><FileTextIcon className="w-4 h-4 mr-1 text-primary" /> Summary</Button>
                <Button size="sm" variant="outline"><DownloadIcon className="w-4 h-4 mr-1 text-primary" /> Export</Button>
                <Button size="sm" variant="outline"><RefreshCcwIcon className="w-4 h-4 mr-1 text-primary" /> Refresh</Button>
                <Button size="sm" variant="outline"><span role="img" aria-label="Upload">📤</span> Upload</Button>
              </div>
            </Card>
        </div>

          {/* Tabs for all matter tools and insights */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
            <TabsList className="flex justify-between bg-white/5 dark:bg-white/5 backdrop-blur rounded-xl p-1 shadow-lg dark:border dark:border-white/10">
              {["overview", "documents", "tasks", "notes", "billing", "communications", "ai", "timeline"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="flex-1 py-2 text-sm rounded-xl transition-all data-[state=active]:bg-blue-100 data-[state=active]:text-blue-600"
                >
                  {t === "ai" ? "AI" : t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
          </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="pt-6 space-y-6">
              <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-primary font-semibold text-lg mb-4">AI-Powered Legal Insights</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-tr from-green-400/10 via-background to-green-200/10 p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground">Retention Risk</p>
                      <p className="text-green-400 font-bold">{insights.retention}</p>
                    </div>
                    <div className="bg-gradient-to-tr from-yellow-400/10 via-background to-yellow-200/10 p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground">Billing Suggestion</p>
                      <p className="text-yellow-400 font-bold">{insights.billing}</p>
                    </div>
                    <div className="bg-gradient-to-tr from-blue-400/10 via-background to-blue-200/10 p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground">Complexity</p>
                      <p className="text-blue-400 font-bold">{insights.complexity}</p>
                    </div>
                    <div className="bg-gradient-to-tr from-purple-400/10 via-background to-purple-200/10 p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground">Win Probability</p>
                      <p className="text-purple-400 font-bold">{insights.winProb}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-primary font-semibold text-lg mb-4">Activity Trend (Weekly Tasks)</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={activityTrend}>
                      <defs>
                        <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#7dd3fc" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', color: '#1e293b' }} />
                      <Area type="monotone" dataKey="tasks" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorTasks)" />
                    </AreaChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="pt-6">
              <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 animate-fade-in p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-primary font-semibold text-lg mb-4 flex items-center gap-2"><FileTextIcon className="w-5 h-5 text-blue-400" /> Documents</h2>
                  {/* TODO: List, upload, generate, and AI-draft documents */}
                  <div className="flex flex-col gap-4">
                    <Button variant="outline" className="w-fit"><FilePlus2Icon className="w-4 h-4 mr-1" /> Upload Document</Button>
                    <Button variant="outline" className="w-fit"><FileSignatureIcon className="w-4 h-4 mr-1" /> AI Draft Contract</Button>
                    <div className="text-slate-500 mt-4">Document management coming soon...</div>
                      </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4" ref={tasksTabRef}>
              <TaskList
                matterId={params.id}
                matterTitle={matter?.title || ''}
                matterLink={`/matters/${params.id}`}
                hasTemplate={!!matter?.applied_template_id}
                onTemplateSelect={handleUseTemplate}
                onCustomTaskList={() => setShowCustomTaskList(true)}
              />
            </TabsContent>

            {/* Matter Notes Tab */}
            <TabsContent value="notes" className="pt-6">
              <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 animate-fade-in p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-primary font-semibold text-lg mb-4 flex items-center gap-2"><FileTextIcon className="w-5 h-5 text-blue-400" /> Matter Notes</h2>
                  {/* TODO: Add notes functionality */}
                  <div className="flex flex-col gap-4">
                    <Button variant="outline" className="w-fit"><FilePlus2Icon className="w-4 h-4 mr-1" /> Add Note</Button>
                    <div className="text-slate-500 mt-4">Notes functionality coming soon...</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="pt-6">
              <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-primary font-semibold text-lg mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-400" /> Billing & Time Tracking</h2>
                  {/* TODO: Show billing details, invoices, time tracking, payments */}
                  <div className="flex flex-col gap-4">
                    <Button variant="outline" className="w-fit"><FileTextIcon className="w-4 h-4 mr-1" /> Generate Invoice</Button>
                    <Button variant="outline" className="w-fit"><RefreshCcwIcon className="w-4 h-4 mr-1" /> Sync Time Logs</Button>
                    <div className="text-slate-500 mt-4">Billing details coming soon...</div>
                      </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Communications Tab */}
            <TabsContent value="communications" className="pt-6">
              <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 animate-fade-in p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-primary font-semibold text-lg mb-4 flex items-center gap-2"><MessageCircleIcon className="w-5 h-5 text-blue-400" /> Communications</h2>
                  {/* TODO: Show messages, notes, calls, emails */}
                  <div className="flex flex-col gap-4">
                    <Button variant="outline" className="w-fit"><SendIcon className="w-4 h-4 mr-1" /> New Message</Button>
                    <Button variant="outline" className="w-fit"><BotIcon className="w-4 h-4 mr-1" /> AI Summarize</Button>
                    <div className="text-slate-500 mt-4">Communications coming soon...</div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

            {/* AI Tools Tab */}
            <TabsContent value="ai" className="pt-6">
              <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-primary font-semibold text-lg mb-4 flex items-center gap-2"><BotIcon className="w-5 h-5 text-blue-400" /> AI Tools</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button variant="outline" className="flex items-center gap-2"><FileSignatureIcon className="w-4 h-4" /> Draft Contract</Button>
                    <Button variant="outline" className="flex items-center gap-2"><FileSearch2Icon className="w-4 h-4" /> Precedent Search</Button>
                    <Button variant="outline" className="flex items-center gap-2"><BookOpenIcon className="w-4 h-4" /> Legal Research</Button>
                    <Button variant="outline" className="flex items-center gap-2"><CheckCircle2Icon className="w-4 h-4" /> Run Conflict Check</Button>
                    <Button variant="outline" className="flex items-center gap-2"><LightbulbIcon className="w-4 h-4" /> Smart Suggestions</Button>
                    <Button variant="outline" className="flex items-center gap-2"><SendIcon className="w-4 h-4" /> Ask AI</Button>
                          </div>
                  <div className="mt-8">
                    {/* TODO: Add AI chat, document generation, and workflow automation */}
                    <div className="text-slate-500">AI-powered workflow tools coming soon...</div>
                      </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="pt-6">
              <Card className="rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-800/20 animate-fade-in p-4 space-y-2 backdrop-blur-sm bg-gradient-to-br from-white via-blue-50 to-pink-100/50 dark:bg-[#1a2540]/50 text-foreground transition-colors hover:shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-primary font-semibold text-lg mb-4 flex items-center gap-2"><HistoryIcon className="w-5 h-5 text-blue-400" /> Timeline & Activity</h2>
                  {/* TODO: Show all matter activity, status changes, document uploads, etc. */}
                  <div className="flex flex-col gap-4 mt-4">
                    <Button variant="outline" className="w-fit"><RefreshCcwIcon className="w-4 h-4 mr-1" /> Refresh Timeline</Button>
                    <div className="text-slate-500 mt-4">Timeline and activity coming soon...</div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </LayoutWithSidebar>
  );
} 