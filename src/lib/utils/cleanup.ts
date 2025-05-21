export class CleanupManager {
  private cleanupTasks: (() => void)[] = [];

  add(task: () => void) {
    this.cleanupTasks.push(task);
  }

  async cleanup() {
    for (const task of this.cleanupTasks) {
      try {
        await task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    }
    this.cleanupTasks = [];
  }
}

export function withCleanup<T extends (...args: any[]) => any>(
  fn: T,
  cleanup: () => void
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } finally {
      cleanup();
    }
  }) as T;
}

export function createCleanupScope() {
  const manager = new CleanupManager();
  return {
    add: manager.add.bind(manager),
    cleanup: manager.cleanup.bind(manager)
  };
} 