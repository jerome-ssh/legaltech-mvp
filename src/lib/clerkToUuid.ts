import { supabase } from './supabase';

export async function getUuidFromClerkId(clerkId: string): Promise<string> {
  const { data, error } = await supabase
    .from('clerk_user_map')
    .select('user_id')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('User not found in clerk_user_map');
  }
  return data.user_id;
} 