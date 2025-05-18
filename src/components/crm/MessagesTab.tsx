import { useState, useMemo, useEffect } from 'react';
import { useMessages, Message } from '@/hooks/useMessages';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns';
import { Search, Send, Filter, Bell, Mail, MessageCircle, X, Paperclip, Star, Users, ChevronDown, ChevronUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';

// Collapsible AI summary section
function AISummary({ thread, collapsed, onToggle, loading, onRegenerate }: { thread: Message[]; collapsed: boolean; onToggle: () => void; loading?: boolean; onRegenerate?: () => void }) {
  if (!thread.length) return null;
  const participants = Array.from(new Set(thread.map(m => m.sender_name || m.sender_id)));
  return (
    <div className="mb-2">
      <button className="flex items-center gap-2 text-cyan-900 dark:text-cyan-200 font-semibold mb-1 focus:outline-none" onClick={onToggle}>
        AI Summary
        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>
      {!collapsed && (
        <div className="rounded-lg bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 p-3 text-sm text-cyan-800 dark:text-cyan-100">
          {loading ? (
            <span>Generating summary...</span>
          ) : (
            <>
              This conversation has <b>{thread.length}</b> messages from <b>{participants.length}</b> participant{participants.length !== 1 ? 's' : ''}.
              {/* Add more AI-powered insights here! */}
              {onRegenerate && (
                <Button variant="ghost" size="sm" className="ml-2" onClick={onRegenerate}>Regenerate</Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MessagesTab() {
  const { messages, loading, error, markAsRead, sendMessage } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [selectedThreadCaseId, setSelectedThreadCaseId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [aiCollapsed, setAICollapsed] = useState(true);
  const [aiLoading, setAILoading] = useState(false);
  const [aiSummary, setAISummary] = useState<string>('');
  const [aiError, setAIError] = useState<string | null>(null);
  // For attachment upload (scaffold)
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Metrics/insights
  const unreadCount = useMemo(() => messages.filter(m => !m.read).length, [messages]);
  const totalCount = messages.length;
  const todayCount = useMemo(() => messages.filter(m => isToday(new Date(m.created_at))).length, [messages]);
  const thisWeekCount = useMemo(() => messages.filter(m => isThisWeek(new Date(m.created_at))).length, [messages]);

  // Group messages by case (thread)
  const threads = useMemo(() => {
    const grouped: Record<string, Message[]> = {};
    messages.forEach(msg => {
      if (!grouped[msg.case_id]) grouped[msg.case_id] = [];
      grouped[msg.case_id].push(msg);
    });
    Object.values(grouped).forEach(thread => thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    return grouped;
  }, [messages]);

  // For main timeline: show only the latest message per case
  const latestMessages = useMemo(() => {
    return Object.values(threads)
      .map(thread => thread[thread.length - 1])
      .filter(msg => {
        const matchesSearch = msg.message_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.case_title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCase = !selectedCase || msg.case_id === selectedCase;
        return matchesSearch && matchesCase;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [threads, searchQuery, selectedCase]);

  // Get unique cases for filter dropdown
  const uniqueCases = Object.keys(threads).map(caseId => {
    const msg = threads[caseId][0];
    return { id: caseId, title: msg?.case_title || msg?.case_id || 'No Case' };
  });

  // The currently selected thread (all messages for the selected case)
  const selectedThread = selectedThreadCaseId ? threads[selectedThreadCaseId] || [] : [];

  // Fetch AI summary when thread changes or regenerate is clicked
  useEffect(() => {
    if (!selectedThreadCaseId || !selectedThread.length) {
      setAISummary('');
      setAIError(null);
      return;
    }
    setAILoading(true);
    setAIError(null);
    fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread: selectedThread }),
    })
      .then(res => res.json())
      .then(data => {
        setAISummary(data.summary || 'No summary available.');
        setAILoading(false);
      })
      .catch(() => {
        setAIError('Failed to generate summary.');
        setAILoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadCaseId]);

  // Upload files to Supabase Storage and return array of { url, name, type }
  const uploadFiles = async (files: File[]): Promise<{ url: string; name: string; type: string }[]> => {
    const uploaded: { url: string; name: string; type: string }[] = [];
    for (const file of files) {
      const filePath = `messages/${Date.now()}-${file.name}`;
      console.log('Uploading file to Supabase:', file.name, filePath);
      const { data, error } = await supabase.storage.from('message-attachments').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      console.log('Upload response:', { data, error });
      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }
      const { data: publicUrlData, error: publicUrlError } = supabase.storage.from('message-attachments').getPublicUrl(filePath);
      console.log('Public URL response:', { publicUrlData, publicUrlError });
      if (publicUrlError) {
        console.error('Supabase public URL error:', publicUrlError);
        throw publicUrlError;
      }
      uploaded.push({ url: publicUrlData.publicUrl, name: file.name, type: file.type });
    }
    return uploaded;
  };

  const handleSendReply = async () => {
    console.log('handleSendReply called', { reply, attachments, selectedThreadCaseId });
    if (!reply.trim() && attachments.length === 0) return;
    if (!selectedThreadCaseId) return;
    setUploading(true);
    try {
      let uploadedAttachments: { url: string; name: string; type: string }[] = [];
      if (attachments.length > 0) {
        try {
          uploadedAttachments = await uploadFiles(attachments);
        } catch (uploadErr) {
          console.error('Supabase upload error:', uploadErr);
          throw uploadErr;
        }
      }
      console.log('Upload complete, about to call sendMessage', uploadedAttachments);
      // Send message with attachments as JSON
      console.log('Calling sendMessage...');
      try {
        await sendMessage(reply, selectedThreadCaseId, uploadedAttachments.length > 0 ? uploadedAttachments : undefined);
        console.log('sendMessage resolved');
      } catch (insertErr) {
        console.error('Supabase insert error:', insertErr);
        throw insertErr;
      }
      setReply('');
      setAttachments([]);
    } catch (err: any) {
      alert('Failed to send message or upload attachments.');
      console.error('General error:', err);
      if (err && typeof err === 'object') {
        if (err.message) console.error('Error message:', err.message);
        if (err.error) console.error('Error error:', err.error);
        if (err.status) console.error('Error status:', err.status);
        if (err.body) console.error('Error body:', err.body);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleOpenThread = (caseId: string) => {
    setSelectedThreadCaseId(caseId);
    (threads[caseId] || []).forEach(msg => {
      if (!msg.read) markAsRead(msg.id);
    });
  };

  const handleCloseDetail = () => {
    setSelectedThreadCaseId(null);
    setReply('');
    setAttachments([]);
    setAICollapsed(true);
  };

  // Quick actions (scaffold)
  const handleMarkImportant = () => {
    // TODO: implement mark important logic
    alert('Marked as important!');
  };
  const handleAssign = () => {
    // TODO: implement assign logic
    alert('Assign dialog would open!');
  };
  const handleAttach = () => {
    document.getElementById('attachment-input')?.click();
  };
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };
  // Regenerate handler
  const handleRegenerateAI = () => {
    if (!selectedThreadCaseId || !selectedThread.length) return;
    setAILoading(true);
    setAIError(null);
    fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread: selectedThread }),
    })
      .then(res => res.json())
      .then(data => {
        setAISummary(data.summary || 'No summary available.');
        setAILoading(false);
      })
      .catch(() => {
        setAIError('Failed to generate summary.');
        setAILoading(false);
      });
  };

  // Platform card style
  const cardBase =
    'bg-white dark:bg-[#1a2540] border border-border dark:border-[#22315a] shadow-sm dark:shadow-none';
  const unreadDot = (
    <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-2" />
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-destructive">Error loading messages: {error}</p>
      </Card>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Metrics/Insights Bar */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-cyan-500" />
          <span className="font-semibold">Unread:</span>
          <span className="text-lg font-bold text-cyan-600">{unreadCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-cyan-500" />
          <span className="font-semibold">Total:</span>
          <span className="text-lg font-bold text-cyan-600">{totalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          <span className="font-semibold">Today:</span>
          <span className="text-lg font-bold text-green-600">{todayCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">This Week:</span>
          <span className="text-lg font-bold text-blue-600">{thisWeekCount}</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter by Case
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedCase(null)}>
              All Cases
            </DropdownMenuItem>
            {uniqueCases.map(case_ => (
              <DropdownMenuItem
                key={case_.id}
                onClick={() => setSelectedCase(case_.id)}
              >
                {case_.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Timeline: Latest message per case */}
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-3">
          {latestMessages.length === 0 && (
            <Card className="p-4 text-center text-muted-foreground">
              No messages found.
            </Card>
          )}
          {latestMessages.map((message) => (
            <button
              key={message.case_id}
              className={`w-full text-left focus:outline-none ${cardBase} rounded-lg p-4 flex items-start gap-4 transition-colors hover:border-cyan-400 hover:shadow-md ${selectedThreadCaseId === message.case_id ? 'border-cyan-500 ring-2 ring-cyan-200 dark:ring-cyan-700' : ''}`}
              onClick={() => handleOpenThread(message.case_id)}
            >
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${message.sender_id}`} />
                <AvatarFallback>
                  {typeof message.sender_name === 'string'
                    ? message.sender_name.split(' ').map(n => n[0]).join('')
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {threads[message.case_id].some(m => !m.read) && unreadDot}
                  <span className="font-medium text-base">{message.sender_name || message.sender_id}</span>
                  <Badge variant="outline">{message.case_title || message.case_id}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                  {threads[message.case_id].some(m => !m.read) && (
                    <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200">Unread</Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed line-clamp-2 opacity-90">
                  {message.message_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Thread Detail Side Panel */}
      {selectedThreadCaseId && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30 dark:bg-black/60">
          <div className="w-full max-w-xl h-full bg-white dark:bg-[#10172a] shadow-xl border-l border-border dark:border-[#22315a] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-[#22315a]">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`https://avatar.vercel.sh/${selectedThread[0]?.sender_id}`} />
                  <AvatarFallback>
                    {typeof selectedThread[0]?.sender_name === 'string'
                      ? selectedThread[0]?.sender_name.split(' ').map(n => n[0]).join('')
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{selectedThread[0]?.case_title || selectedThread[0]?.case_id}</div>
                  <div className="text-xs text-muted-foreground">Participants: {Array.from(new Set(selectedThread.map(m => m.sender_name || m.sender_id))).join(', ')}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseDetail}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Collapsible AI Summary */}
              <div className="mb-2">
                <button className="flex items-center gap-2 text-cyan-900 dark:text-cyan-200 font-semibold mb-1 focus:outline-none" onClick={() => setAICollapsed(v => !v)}>
                  AI Summary
                  {aiCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
                {!aiCollapsed && (
                  <div className="rounded-lg bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 p-3 text-sm text-cyan-800 dark:text-cyan-100">
                    {aiLoading ? (
                      <span>Generating summary...</span>
                    ) : aiError ? (
                      <span className="text-destructive">{aiError}</span>
                    ) : (
                      <>
                        {aiSummary}
                        <Button variant="ghost" size="sm" className="ml-2" onClick={handleRegenerateAI}>Regenerate</Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Thread Timeline */}
              <div className="space-y-4">
                {selectedThread.map((msg, idx) => (
                  <div key={msg.id} className={`flex gap-3 items-start ${msg.read ? '' : 'bg-cyan-50 dark:bg-cyan-900/30 rounded-lg'}`}>
                    <Avatar className="mt-1">
                      <AvatarImage src={`https://avatar.vercel.sh/${msg.sender_id}`} />
                      <AvatarFallback>
                        {typeof msg.sender_name === 'string'
                          ? msg.sender_name.split(' ').map(n => n[0]).join('')
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{msg.sender_name || msg.sender_id}</span>
                        {!msg.read && <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200">Unread</Badge>}
                        {idx === 0 && <Badge variant="secondary">First Message</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</div>
                      <div className="text-sm leading-relaxed whitespace-pre-line">{msg.message_text}</div>
                      {/* Display all attachments */}
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att: any, i: number) => (
                            <a key={i} href={att.url} className="flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900 rounded text-cyan-800 dark:text-cyan-100 text-xs hover:underline" target="_blank" rel="noopener noreferrer">
                              <Paperclip className="h-4 w-4" />
                              {att.name || 'Attachment'}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Quick Actions & Reply */}
            <div className="p-4 border-t border-border dark:border-[#22315a] space-y-2">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={handleMarkImportant}><Star className="h-4 w-4 mr-1" /> Mark Important</Button>
                <Button variant="outline" size="sm" onClick={handleAssign}><Users className="h-4 w-4 mr-1" /> Assign</Button>
                <Button variant="outline" size="sm" onClick={handleAttach}><Paperclip className="h-4 w-4 mr-1" /> Attach</Button>
                <input id="attachment-input" type="file" className="hidden" onChange={handleAttachmentChange} multiple />
                {attachments.length > 0 && <span className="text-xs text-cyan-600">{attachments.map(f => f.name).join(', ')}</span>}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  disabled={uploading}
                />
                <Button
                  onClick={handleSendReply}
                  disabled={(!reply.trim() && attachments.length === 0) || uploading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 