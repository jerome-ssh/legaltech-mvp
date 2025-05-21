import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

export async function createUserWithClerk(clerkId: string, otherUserFields: any) {
  const userId = uuidv4();

  // Insert into users table
  await supabase.from('users').insert([
    { id: userId, ...otherUserFields }
  ]);

  // Insert into clerk_user_map
  await supabase.from('clerk_user_map').insert([
    { clerk_id: clerkId, user_id: userId }
  ]);

  return userId;
} 