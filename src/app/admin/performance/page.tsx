import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';

export default function PerformancePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">System Performance Dashboard</h1>
      <PerformanceDashboard />
    </div>
  );
} 