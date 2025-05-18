import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET /api/schedules
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching schedules:', error);
        return res.status(500).json({ error: 'Failed to fetch schedules' });
      }

      return res.status(200).json(data);
    }

    // POST /api/schedules
    if (req.method === 'POST') {
      const { title, description, start_time, end_time, type, status, participants, location } = req.body;

      const { data, error } = await supabase
        .from('schedules')
        .insert([
          {
            user_id: userId,
            title,
            description,
            start_time,
            end_time,
            type,
            status,
            participants,
            location,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating schedule:', error);
        return res.status(500).json({ error: 'Failed to create schedule' });
      }

      return res.status(201).json(data);
    }

    // PUT /api/schedules
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;

      const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating schedule:', error);
        return res.status(500).json({ error: 'Failed to update schedule' });
      }

      return res.status(200).json(data);
    }

    // DELETE /api/schedules
    if (req.method === 'DELETE') {
      const { id } = req.body;

      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting schedule:', error);
        return res.status(500).json({ error: 'Failed to delete schedule' });
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in schedules API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 