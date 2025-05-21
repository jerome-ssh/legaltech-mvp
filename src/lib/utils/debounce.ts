export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let lastPromise: Promise<ReturnType<T>> | null = null;

  return function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeout) {
      clearTimeout(timeout);
    }

    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          lastPromise = Promise.resolve(result);
          resolve(result);
        } catch (error) {
          lastPromise = Promise.reject(error);
          reject(error);
        }
      }, wait);
    });
  };
} 