import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

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

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For now, just map the basic fields
      const formattedMessages = (data as any[]).map(msg => ({
        id: msg.id,
        message_text: msg.message_text,
        created_at: msg.created_at,
        read: msg.read,
        sender_name: msg.sender_id, // fallback to sender_id for now
        case_title: msg.case_id,    // fallback to case_id for now
        case_id: msg.case_id,
        sender_id: msg.sender_id
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
  }, [toast]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
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
  }, [toast]);

  const sendMessage = useCallback(async (
    messageText: string,
    caseId: string,
    attachments?: { url: string; name: string; type: string }[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User from supabase.auth.getUser:', user);
      if (!user) throw new Error('No authenticated user');

      console.log('Inserting message into Supabase...');
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
      console.log('Insert finished');

      console.log('Supabase message insert response:', { data, error });

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
  }, [fetchMessages, toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    markAsRead,
    sendMessage
  };
} 