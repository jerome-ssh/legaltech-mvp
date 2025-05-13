import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export function useJsonErrorCatcher() {
    const router = useRouter();
    
    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;
        
        // Check if the page is showing a raw JSON error (e.g. from a failed fetch)
        const pre = document.querySelector('pre');
        if (pre) {
            try {
                const json = JSON.parse(pre.textContent || '');
                if (json && json.error) {
                    toast.error(json.error || 'An error occurred.');
                    // Optionally, redirect to login or clear the error
                    setTimeout(() => {
                        router.replace('/login');
                    }, 2000);
                }
            } catch (e) {
                // Not JSON, ignore
            }
        }
    }, [router]);
} 