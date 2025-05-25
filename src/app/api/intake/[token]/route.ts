import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Form validation schema with proper types
const formSchema = z.object({
  title_id: z.string().min(1, 'Title is required').transform(val => parseInt(val, 10)),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string()
    .min(1, 'Phone number is required')
    .transform(val => val.startsWith('+') ? val : `+${val}`)
    .refine(val => /^\+[1-9]\d{1,14}$/.test(val), {
      message: 'Please enter a valid international phone number starting with +'
    }),
  address: z.string().min(1, 'Address is required'),
  preferred_language_id: z.string().min(1, 'Preferred language is required').transform(val => parseInt(val, 10)),
  client_type_id: z.string().min(1, 'Client type is required').transform(val => parseInt(val, 10)),
  additional_notes: z.string().optional()
});

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
        matter:matters (
          title,
          description
        )
      `)
      .eq('token', params.token)
      .single();

    if (error) {
      console.error('Error fetching intake link:', error);
      return NextResponse.json({ error: 'Failed to fetch intake form details' }, { status: 500 });
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
    // Fetch intake form link
    const { data: intakeLink, error: linkError } = await supabase
      .from('matter_intake_links')
      .select('*')
      .eq('token', params.token)
      .single();

    if (linkError) {
      console.error('Error fetching intake link:', linkError);
      return NextResponse.json(
        { error: 'Failed to fetch intake form link' },
        { status: 500 }
      );
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

    // Parse and validate form data
    const formData = await request.json();
    const validatedData = formSchema.parse(formData);

    // Start a transaction
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        title_id: validatedData.title_id,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        email: validatedData.email,
        phone_number: validatedData.phone_number,
        address: validatedData.address,
        preferred_language_id: validatedData.preferred_language_id,
        client_type_id: validatedData.client_type_id,
        additional_notes: validatedData.additional_notes
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      return NextResponse.json(
        { error: 'Failed to create client record' },
        { status: 500 }
      );
    }

    // Update matter status
    try {
      // Create a unique status name with timestamp
      const statusName = `intake_completed_${Date.now()}`;
      
      // Insert new matter status
      const { error: statusError } = await supabase
        .from('matter_status')
        .insert({
          matter_id: intakeLink.matter_id,
          name: statusName,
          description: 'Client intake form completed'
        });

      if (statusError) {
        console.error('Error updating matter status:', statusError);
        // Don't fail the request, just log the error
      }

      // Update matter status
      const { error: matterError } = await supabase
        .from('matters')
        .update({ status: 'intake_completed' })
        .eq('id', intakeLink.matter_id);

      if (matterError) {
        console.error('Error updating matter:', matterError);
        // Don't fail the request, just log the error
      }
    } catch (statusError) {
      console.error('Error in matter status update:', statusError);
      // Don't fail the request, just log the error
    }

    // Update intake link status
    const { error: updateError } = await supabase
      .from('matter_intake_links')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        form_data: formData
      })
      .eq('id', intakeLink.id);

    if (updateError) {
      console.error('Error updating intake link:', updateError);
      return NextResponse.json(
        { error: 'Failed to update intake form status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Intake form submitted successfully',
      client
    });
  } catch (error) {
    console.error('Error submitting intake form:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 