import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fetch the user's preferred terminology ('matter' or 'case') from the profiles table.
 * Defaults to 'matter' if not set or on error.
 * Usage: const terminology = await getPreferredTerminology(userId);
 */
export async function getPreferredTerminology(userId: string): Promise<'matter' | 'case'> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_terminology')
      .eq('user_id', userId)
      .single();
    if (error || !data?.preferred_terminology) return 'matter';
    return data.preferred_terminology === 'case' ? 'case' : 'matter';
  } catch {
    return 'matter';
  }
} 