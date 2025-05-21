import { createClient } from '@supabase/supabase-js';
import { performanceMonitor } from './monitoring';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-application-name': 'legaltech-mvp'
      }
    }
  }
);

export async function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    performanceMonitor.logMetric({
      operation,
      duration,
      timestamp: Date.now(),
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    performanceMonitor.logMetric({
      operation,
      duration,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

export { supabase };
