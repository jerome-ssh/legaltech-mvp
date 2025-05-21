import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/monitoring';

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(
          metrics.reduce((acc, m) => {
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
          }, {})
        ).map(([operation, stats]: [string, any]) => (
          <div key={operation} className="p-4 border rounded">
            <h3 className="font-semibold">{operation}</h3>
            <p>Avg Duration: {(stats.total / stats.count).toFixed(2)}ms</p>
            <p>Total Calls: {stats.count}</p>
            <p>Error Rate: {((stats.errors / stats.count) * 100).toFixed(2)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
} 