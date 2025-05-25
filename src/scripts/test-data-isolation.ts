import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
const supabase = createClient(
  'https://ueqzjuclosoedybixqgs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcXpqdWNsb3NvZWR5Yml4cWdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU5NjYxNCwiZXhwIjoyMDYzMTcyNjE0fQ.I371tSSWCaWNvLAOm1Cttj7TxLcq7E6a9cFmRcPViZk',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTestProfile(userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: crypto.randomUUID(), // Generate a UUID for the profile
      user_id: crypto.randomUUID(), // Generate a UUID for the user
      clerk_id: userId,
      email: `test.${userId}@example.com`,
      first_name: `Test`,
      last_name: `User ${userId}`,
      role: 'user',
      onboarding_completed: true
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating profile for ${userId}:`, error.message);
    return null;
  }

  return profile;
}

async function createTestData(profileId: string) {
  // Create a test client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      name: `Test Client for ${profileId}`,
      email: `client.${profileId}@example.com`,
      phone: '+1234567890',
      address: '123 Test St, Test City, TS 12345'
    })
    .select()
    .single();

  if (clientError) {
    console.error('Error creating client:', clientError.message);
  }

  // Create a test case
  const { data: case_, error: caseError } = await supabase
    .from('cases')
    .insert({
      title: `Test Case for ${profileId}`,
      description: `This is a test case for ${profileId}`,
      status: 'active',
      client_id: client?.id,
      profile_id: profileId,
      created_by: profileId
    })
    .select()
    .single();

  if (caseError) {
    console.error('Error creating case:', caseError.message);
  }

  // Create a test message
  if (case_) {
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        case_id: case_.id,
        sender_id: profileId,
        recipient_id: profileId,
        message_type: 'text',
        content: `Test message for ${profileId}`,
        is_read: false,
        status: 'active'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError.message);
    }
  }
}

async function testUserAccess(userId: string) {
  console.log(`\n=== Testing access for user: ${userId} ===`);
  
  try {
    // Create test profile if it doesn't exist
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    let profile = existingProfile;
    if (!profile) {
      profile = await createTestProfile(userId);
      if (profile) {
        await createTestData(profile.id);
      }
    }

    if (!profile) {
      console.error(`Failed to create or find profile for ${userId}`);
      return;
    }

    // Test profile access
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', userId);
    
    console.log('\n📋 Profiles:');
    if (profilesError) {
      console.error('Error accessing profiles:', profilesError.message);
    } else {
      console.log(profiles);
    }

    // Test clients access
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    console.log('\n👥 Clients:');
    if (clientsError) {
      console.error('Error accessing clients:', clientsError.message);
    } else {
      console.log(clients);
    }

    // Test matters access
    const { data: matters, error: mattersError } = await supabase
      .from('matters')
      .select('*');
    console.log('\n📁 Matters:');
    if (mattersError) {
      console.error('Error accessing matters:', mattersError.message);
    } else {
      console.log(matters);
    }

    // Test messages access
    if (matters && matters.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('matter_id', matters[0].id);
      
      console.log('\n💬 Messages:');
      if (messagesError) {
        console.error('Error accessing messages:', messagesError.message);
      } else {
        console.log(messages);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function main() {
  console.log('🔍 Starting data isolation test...\n');
  
  // Test User 1 access
  await testUserAccess('user_1');
  
  // Test User 2 access
  await testUserAccess('user_2');
  
  console.log('\n✅ Test completed');
}

main().catch(console.error); 