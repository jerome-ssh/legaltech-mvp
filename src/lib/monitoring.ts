// src/lib/monitoring.ts
interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: number;
    success: boolean;
    error?: string;
  }
  
  class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private readonly maxMetrics = 1000;
  
    logMetric(metric: PerformanceMetric): void {
      this.metrics.push(metric);
      if (this.metrics.length > this.maxMetrics) {
        this.metrics.shift();
      }
    }
  
    getMetrics(): PerformanceMetric[] {
      return this.metrics;
    }
  
    getAverageDuration(operation: string): number {
      const relevantMetrics = this.metrics.filter(m => m.operation === operation);
      if (relevantMetrics.length === 0) return 0;
      
      const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
      return total / relevantMetrics.length;
    }
  
    clearMetrics(): void {
      this.metrics = [];
    }
  }
  
  export const performanceMonitor = new PerformanceMonitor();