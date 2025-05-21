import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PrefetchOptions {
  priority?: boolean;
  revalidate?: number;
}

export function usePrefetch() {
  const router = useRouter();

  const prefetch = useCallback(async (
    url: string,
    options: PrefetchOptions = {}
  ) => {
    try {
      await router.prefetch(url, options);
    } catch (error) {
      console.error('Prefetch error:', error);
    }
  }, [router]);

  const prefetchMultiple = useCallback(async (
    urls: string[],
    options: PrefetchOptions = {}
  ) => {
    await Promise.all(urls.map(url => prefetch(url, options)));
  }, [prefetch]);

  return {
    prefetch,
    prefetchMultiple
  };
}

export function usePrefetchOnMount(urls: string[], options: PrefetchOptions = {}) {
  const { prefetchMultiple } = usePrefetch();

  useEffect(() => {
    prefetchMultiple(urls, options);
  }, [prefetchMultiple, urls, options]);
} 