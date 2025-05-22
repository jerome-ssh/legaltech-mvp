import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    // Get upcoming reminders
    const { data: reminders, error } = await supabase
      .rpc('check_schedule_reminders');

    if (error) {
      console.error('Error fetching reminders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process each reminder
    for (const reminder of reminders) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', reminder.profile_id)
        .single();

      if (profile) {
        // Send notification
        await sendNotification({
          user: profile,
          userId: profile.clerk_id,
          caseTitle: reminder.title,
          message: `Reminder: ${reminder.title} starts in ${reminder.reminder_time}`,
          type: 'meetingInvite',
          meetingDetails: {
            time: reminder.start_time,
            title: reminder.title
          }
        });

        // Mark reminder as sent
        await supabase
          .from('schedules')
          .update({ reminder_sent: true })
          .eq('id', reminder.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 