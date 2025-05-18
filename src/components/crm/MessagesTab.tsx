import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AppError } from '@/lib/errors';
import { CRMErrorBoundary } from './ErrorBoundary';

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none">
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
        <p className="text-destructive">Error loading messages: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Messages</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {Array.isArray(threads) && threads.length === 0 && (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No messages yet.
              </CardContent>
            </Card>
          )}
          {Array.isArray(threads) && threads.map((thread) => (
            <Card
              key={thread.id}
              className={`bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none cursor-pointer hover:bg-[#e6f0ff] dark:hover:bg-[#1e2d4d] transition-colors ${
                selectedThread?.id === thread.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedThread(thread)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{thread.subject}</h3>
                  {thread.status === 'unread' && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {thread.last_message}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{thread.sender}</span>
                  <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedThread ? (
            <Card className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {selectedThread.subject}
                    </h3>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>
                        From: {selectedThread.sender} | To: {selectedThread.recipient}
                      </span>
                      <span>
                        {new Date(selectedThread.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedThread.messages.length === 0 && (
                      <p className="text-center text-muted-foreground">No messages in this thread.</p>
                    )}
                    {selectedThread.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.sender === 'current_user'
                            ? 'bg-primary/10 ml-8'
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{message.sender}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button onClick={handleReply} disabled={!replyContent.trim()}>
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Select a conversation to view messages
                </p>
              </CardContent>
            </Card>
          )}
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