declare module '@/components/ui/scroll-area' {
  import * as React from 'react';
  export const ScrollArea: React.FC<React.PropsWithChildren<{ className?: string }>>;
  export const ScrollBar: React.FC<React.PropsWithChildren<{ orientation?: 'vertical' | 'horizontal'; className?: string }>>;
} 