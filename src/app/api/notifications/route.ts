import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Server, Socket } from 'socket.io';

const io = new Server();

io.on('connection', (socket: Socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lt('due_date', new Date(new Date().setDate(new Date().getDate() + 7)).toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;

    // Emit real-time notifications to connected clients
    io.emit('notifications', { notifications: data });

    return NextResponse.json({ notifications: data });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
} 