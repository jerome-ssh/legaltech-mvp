import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Send, Clock, User, Mail, Paperclip } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AppError } from '@/lib/errors';
import { CRMErrorBoundary } from './ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  thread_id: string;
  subject: string;
  content: string;
  sender: string;
  recipient: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
}

interface MessageThread {
  id: string;
  subject: string;
  last_message: string;
  sender: string;
  recipient: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
  messages: Message[];
}

function groupMessagesByThread(messages: Message[]): MessageThread[] {
  const threadsMap: { [threadId: string]: MessageThread } = {};

  messages.forEach((msg) => {
    if (!threadsMap[msg.thread_id]) {
      threadsMap[msg.thread_id] = {
        id: msg.thread_id,
        subject: msg.subject || '(No Subject)',
        last_message: msg.content,
        sender: msg.sender,
        recipient: msg.recipient,
        status: msg.status,
        created_at: msg.created_at,
        messages: [],
      };
    }
    threadsMap[msg.thread_id].messages.push(msg);

    // Update last_message and created_at if this message is newer
    if (
      new Date(msg.created_at) >
      new Date(threadsMap[msg.thread_id].created_at)
    ) {
      threadsMap[msg.thread_id].last_message = msg.content;
      threadsMap[msg.thread_id].created_at = msg.created_at;
      threadsMap[msg.thread_id].status = msg.status;
    }
  });

  // Sort threads by most recent message
  return Object.values(threadsMap).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function MessagesTabContent() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/messages');
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        if (mounted) {
          const messages = Array.isArray(data) ? data : [];
          setThreads(groupMessagesByThread(messages));
        }
      } catch (err) {
        if (mounted) {
          setError('An unexpected error occurred while loading messages');
          console.error('Error loading messages:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleThreadSelect = async (thread: MessageThread) => {
    try {
      const response = await fetch(`/api/messages/${thread.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch thread messages');
      }

      const data = await response.json();
      setSelectedThread({
        ...thread,
        messages: data.data
      });

      // Mark thread as read if it's unread
      if (thread.status === 'unread') {
        const updateResponse = await fetch(`/api/messages/${thread.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'read' }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update thread status');
        }

        setThreads(threads.map(t =>
          t.id === thread.id ? { ...t, status: 'read' } : t
        ));
      }
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message);
      } else {
        setError('Failed to load thread messages');
        console.error('Error loading thread:', err);
      }
    }
  };

  const handleReply = async () => {
    if (!selectedThread || !replyContent.trim()) return;

    try {
      const response = await fetch(`/api/messages/${selectedThread.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          recipient: selectedThread.recipient
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      // Refresh thread messages
      const messagesResponse = await fetch(`/api/messages/${selectedThread.id}`);
      if (!messagesResponse.ok) {
        throw new Error('Failed to refresh thread messages');
      }

      const messagesData = await messagesResponse.json();
      setSelectedThread({
        ...selectedThread,
        messages: messagesData.data
      });
      setReplyContent('');
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message);
      } else {
        setError('Failed to send reply');
        console.error('Error sending reply:', err);
      }
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.recipient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-red-500 dark:text-red-400">Error loading messages: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <AnimatePresence>
            {Array.isArray(filteredThreads) && filteredThreads.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20">
                  <CardContent className="p-4 text-center text-gray-600 dark:text-gray-300">
                    No messages yet.
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {Array.isArray(filteredThreads) && filteredThreads.map((thread) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                    selectedThread?.id === thread.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedThread(thread)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{thread.subject}</h3>
                      {thread.status === 'unread' && (
                        <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {thread.last_message}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        <span>{thread.sender}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedThread ? (
              <motion.div
                key={selectedThread.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                          {selectedThread.subject}
                        </h3>
                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              <span>From: {selectedThread.sender}</span>
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              <span>To: {selectedThread.recipient}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{new Date(selectedThread.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedThread.messages.length === 0 && (
                          <p className="text-center text-gray-600 dark:text-gray-300">No messages in this thread.</p>
                        )}
                        {selectedThread.messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-lg ${
                              message.sender === 'current_user'
                                ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 ml-8'
                                : 'bg-gray-100/50 dark:bg-gray-800/50 mr-8'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{message.sender}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(message.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{message.content}</p>
                          </motion.div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[100px] bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20"
                          />
                          <Button
                            className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                            onClick={handleReply}
                            disabled={!replyContent.trim()}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
                  <CardContent className="p-6">
                    <p className="text-center text-gray-600 dark:text-gray-300">
                      Select a conversation to view messages
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function MessagesTab() {
  return (
    <CRMErrorBoundary>
      <MessagesTabContent />
    </CRMErrorBoundary>
  );
} 