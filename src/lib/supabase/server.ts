import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/types/supabase'

export function createClient(cookieStore?: ReturnType<typeof cookies>) {
  const currentCookies = cookieStore || cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return currentCookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            currentCookies.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting outside of middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            currentCookies.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal outside of middleware
          }
        },
      },
    }
  )
} 