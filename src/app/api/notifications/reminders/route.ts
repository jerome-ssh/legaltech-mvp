import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmailNotification } from '@/lib/sendgrid';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get upcoming reminders
    const { data: reminders, error: remindersError } = await supabase
      .rpc('check_schedule_reminders');

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }

    // Process each reminder
    for (const reminder of reminders) {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, clerk_id')
        .eq('id', reminder.profile_id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        continue;
      }

      // Send email notification if email is enabled
      if (reminder.reminder_type?.includes('email') && profile.email) {
        const subject = `Reminder: ${reminder.title}`;
        const text = `This is a reminder for your scheduled event: ${reminder.title}\nStart Time: ${new Date(reminder.start_time).toLocaleString()}`;
        const html = `
          <h2>Event Reminder</h2>
          <p>This is a reminder for your scheduled event:</p>
          <h3>${reminder.title}</h3>
          <p><strong>Start Time:</strong> ${new Date(reminder.start_time).toLocaleString()}</p>
          <p><strong>Location:</strong> ${reminder.location || 'No location specified'}</p>
          <p><strong>Description:</strong> ${reminder.description || 'No description provided'}</p>
        `;

        await sendEmailNotification(profile.email, subject, text, html);
      }

      // Mark reminder as sent
      await supabase
        .from('schedules')
        .update({ reminder_sent: true })
        .eq('id', reminder.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 