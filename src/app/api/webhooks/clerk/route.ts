import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

// Get environment variables
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

// Validate environment variables
if (!webhookSecret) {
  console.error('Missing required environment variables');
  throw new Error('Missing required environment variables');
}

export async function POST(req: Request) {
  console.log('Webhook: Received request');
  
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Webhook: Missing required headers');
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook: Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log('Webhook: Processing event type:', eventType);

  // Handle both user creation and verification
  if (eventType === 'user.created' || eventType === 'user.updated') {
    try {
      const { id: userId, email_addresses, first_name, last_name, phone_numbers } = evt.data;

      console.log('Webhook: Creating/updating profile for user:', userId);

      // Check if profile already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (existingProfile) {
        console.log('Webhook: Profile already exists, updating...');
        // Update existing profile
        const { data: profile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            email: email_addresses[0]?.email_address || null,
            phone_number: phone_numbers[0]?.phone_number || null,
            first_name: first_name || null,
            last_name: last_name || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (updateError) {
          console.error('Webhook: Error updating profile:', updateError);
          return NextResponse.json(
            { 
              success: false,
              error: "Failed to update profile",
              details: updateError.message
            },
            { status: 500 }
          );
        }

        console.log('Webhook: Profile updated successfully:', profile);
        return NextResponse.json(
          { 
            success: true,
            profile 
          },
          { status: 200 }
        );
      }

      // Create new profile
      console.log('Webhook: Creating new profile...');
      const { data: profile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          clerk_id: userId,
          user_id: userId,
          email: email_addresses[0]?.email_address || null,
          phone_number: phone_numbers[0]?.phone_number || null,
          first_name: first_name || null,
          last_name: last_name || null,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Webhook: Error creating profile:', createError);
        return NextResponse.json(
          { 
            success: false,
            error: "Failed to create profile",
            details: createError.message
          },
          { status: 500 }
        );
      }

      console.log('Webhook: Profile created successfully:', profile);
      return NextResponse.json(
        { 
          success: true,
          profile 
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Webhook: Unexpected error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: "Internal server error",
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }

  // Return a response for other events
  return NextResponse.json(
    { 
      success: true,
      message: 'Webhook processed successfully'
    },
    { status: 200 }
  );
} 