import { LoadingState } from '@/components/ui/loading-state';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingState size="lg" text="Loading page..." />
    </div>
  );
} 