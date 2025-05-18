import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@clerk/nextjs';
import { getAuthenticatedSupabase } from '@/lib/supabaseClient';

export interface Message {
  id: string;
  message_text: string;
  created_at: string;
  read: boolean;
  sender_name: string;
  case_title: string;
  case_id: string;
  sender_id: string;
  attachments?: string | null;
}

interface SupabaseMessage {
  id: string;
  message_text: string;
  created_at: string;
  read: boolean;
  sender_id: string;
  case_id: string;
  attachments?: string | null;
  users: {
    full_name: string;
  } | null;
  cases: {
    title: string;
  } | null;
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isLoaded } = useUser();

  const fetchMessages = useCallback(async () => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = await getAuthenticatedSupabase();
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          users:users(full_name),
          cases:cases(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMessages = (data as SupabaseMessage[]).map(msg => ({
        id: msg.id,
        message_text: msg.message_text,
        created_at: msg.created_at,
        read: msg.read,
        sender_name: msg.users?.full_name || msg.sender_id,
        case_title: msg.cases?.title || msg.case_id,
        case_id: msg.case_id,
        sender_id: msg.sender_id,
        attachments: msg.attachments
      }));

      setMessages(formattedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      toast({
        title: 'Error',
        description: 'Failed to fetch messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user, isLoaded]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!isLoaded || !user) return;

    try {
      const supabase = await getAuthenticatedSupabase();
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );

      toast({
        title: 'Success',
        description: 'Message marked as read'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark message as read',
        variant: 'destructive'
      });
    }
  }, [toast, user, isLoaded]);

  const sendMessage = useCallback(async (
    messageText: string,
    caseId: string,
    attachments?: { url: string; name: string; type: string }[]
  ) => {
    if (!isLoaded || !user) {
      throw new Error('No authenticated user');
    }

    try {
      const supabase = await getAuthenticatedSupabase();
      const { data, error } = await supabase
        .from('messages')
        .insert({
          message_text: messageText,
          case_id: caseId,
          sender_id: user.id,
          read: false,
          attachments: attachments ? attachments : null
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh messages after sending
      await fetchMessages();

      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });

      return data;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
      throw err;
    }
  }, [fetchMessages, toast, user, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      fetchMessages();
    }
  }, [fetchMessages, isLoaded]);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    markAsRead,
    sendMessage
  };
} 