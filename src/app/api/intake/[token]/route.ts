import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/intake/[token] - Get intake form details
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Fetch intake form link
    const { data: intakeLink, error } = await supabase
      .from('matter_intake_links')
      .select(`
        *,
        matter:cases (
          title,
          description
        )
      `)
      .eq('token', params.token)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!intakeLink) {
      return NextResponse.json(
        { error: 'Invalid or expired intake form link' },
        { status: 404 }
      );
    }

    // Check if link has expired
    if (new Date(intakeLink.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('matter_intake_links')
        .update({ status: 'expired' })
        .eq('id', intakeLink.id);

      return NextResponse.json(
        { error: 'This intake form link has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({ intakeLink });
  } catch (error) {
    console.error('Error fetching intake form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/intake/[token] - Submit intake form
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const { form_data } = body;

    if (!form_data) {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }

    // Fetch intake form link
    const { data: intakeLink, error: linkError } = await supabase
      .from('matter_intake_links')
      .select('*')
      .eq('token', params.token)
      .single();

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    if (!intakeLink) {
      return NextResponse.json(
        { error: 'Invalid or expired intake form link' },
        { status: 404 }
      );
    }

    // Check if link has expired
    if (new Date(intakeLink.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('matter_intake_links')
        .update({ status: 'expired' })
        .eq('id', intakeLink.id);

      return NextResponse.json(
        { error: 'This intake form link has expired' },
        { status: 410 }
      );
    }

    // Check if form is already completed
    if (intakeLink.status === 'completed') {
      return NextResponse.json(
        { error: 'This intake form has already been submitted' },
        { status: 400 }
      );
    }

    // Update intake form status and store form data
    const { data: updatedLink, error: updateError } = await supabase
      .from('matter_intake_links')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        form_data
      })
      .eq('id', intakeLink.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update matter status to intake_completed
    const { error: matterError } = await supabase
      .from('matter_status')
      .insert([
        {
          matter_id: intakeLink.matter_id,
          status: 'intake_completed',
          notes: 'Intake form completed by client',
          changed_at: new Date().toISOString()
        }
      ]);

    if (matterError) {
      console.error('Error updating matter status:', matterError);
    }

    return NextResponse.json({ success: true, intakeLink: updatedLink });
  } catch (error) {
    console.error('Error submitting intake form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 