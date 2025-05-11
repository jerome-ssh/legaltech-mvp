import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import env from '@/config/env';

export class SessionManager {
  private static instance: SessionManager;
  private cookieStore?: ReturnType<typeof cookies>;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  setCookieStore(store: ReturnType<typeof cookies>) {
    this.cookieStore = store;
  }

  private getSupabaseClient() {
    return createClient(this.cookieStore);
  }

  async getSession() {
    const { data: { session }, error } = await this.getSupabaseClient().auth.getSession();
    if (error) throw error;
    return session;
  }

  async refreshSession() {
    const { data: { session }, error } = await this.getSupabaseClient().auth.refreshSession();
    if (error) throw error;
    return session;
  }

  async invalidateSession() {
    const { error } = await this.getSupabaseClient().auth.signOut();
    if (error) throw error;
  }

  async rotateSession() {
    const session = await this.getSession();
    if (!session) throw new Error('No active session');

    // Invalidate current session
    await this.invalidateSession();

    // Create new session
    const { data: { session: newSession }, error } = await this.getSupabaseClient().auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) throw error;
    return newSession;
  }

  async updateSessionClaims(claims: Record<string, any>) {
    const session = await this.getSession();
    if (!session) throw new Error('No active session');

    const { data: { session: updatedSession }, error } = await this.getSupabaseClient().auth.updateUser({
      data: claims,
    });

    if (error) throw error;
    return updatedSession;
  }

  async validateSession() {
    const session = await this.getSession();
    if (!session) return false;

    // Check if session is expired
    if (new Date(session.expires_at!) < new Date()) {
      try {
        await this.refreshSession();
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  async enforceSessionExpiry() {
    const session = await this.getSession();
    if (!session) return;

    const expiryTime = new Date(session.expires_at!);
    const now = new Date();
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();

    // If session expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < 300000) {
      await this.refreshSession();
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance(); 