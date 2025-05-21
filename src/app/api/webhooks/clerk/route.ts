import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

// Create a Supabase client using the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response('Error: CLERK_WEBHOOK_SECRET is not set', {
      status: 500
    });
  }

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
    const { id, email_addresses, ...attributes } = evt.data;
    const primaryEmail = email_addresses?.[0]?.email_address;

    if (!primaryEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Upsert the user profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: id,
        email: primaryEmail,
        clerk_id: id,
        full_name: attributes.first_name + ' ' + attributes.last_name,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error upserting profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
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