"use client";
import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/monitoring';

interface Metric {
  operation: string;
  duration: number;
  success: boolean;
}

interface OperationStats {
  total: number;
  count: number;
  errors: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const operationStats = metrics.reduce<Record<string, OperationStats>>((acc, m) => {
    if (!acc[m.operation]) {
      acc[m.operation] = {
        total: 0,
        count: 0,
        errors: 0
      };
    }
    acc[m.operation].total += m.duration;
    acc[m.operation].count++;
    if (!m.success) acc[m.operation].errors++;
    return acc;
  }, {});

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(operationStats).map(([operation, stats]) => (
          <div key={operation} className="p-4 border rounded shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg mb-2">{operation}</h3>
            <div className="space-y-1 text-sm">
              <p>Avg Duration: {(stats.total / stats.count).toFixed(2)}ms</p>
              <p>Total Calls: {stats.count}</p>
              <p>Error Rate: {((stats.errors / stats.count) * 100).toFixed(2)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 