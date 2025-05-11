'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
    return (
        <HotToaster
            position="bottom-right"
            toastOptions={{
                className: 'bg-background text-foreground border border-border',
                duration: 5000,
                style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                },
            }}
        />
    );
} 