import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type OfflineAction = 'create' | 'update' | 'delete';
export type ResourceType = 'matter' | 'document' | 'message';

interface OfflineQueueItem {
  id: string;
  action_type: OfflineAction;
  resource_type: ResourceType;
  resource_id?: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

class OfflineQueue {
  private supabase = createClientComponentClient();
  private profileId: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .single();
        this.profileId = profile?.id || null;
      }
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
    }
  }

  async addToQueue(
    action: OfflineAction,
    resourceType: ResourceType,
    payload: any,
    resourceId?: string
  ): Promise<string | null> {
    if (!this.profileId) {
      console.error('Profile ID not available');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('offline_queue')
        .insert({
          profile_id: this.profileId,
          action_type: action,
          resource_type: resourceType,
          resource_id: resourceId,
          payload,
          status: 'pending',
          retry_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to add item to offline queue:', error);
      return null;
    }
  }

  async processQueue(): Promise<void> {
    if (!this.profileId) {
      console.error('Profile ID not available');
      return;
    }

    try {
      // Get pending items
      const { data: pendingItems, error: fetchError } = await this.supabase
        .from('offline_queue')
        .select('*')
        .eq('profile_id', this.profileId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      for (const item of pendingItems) {
        await this.processItem(item);
      }
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }

  private async processItem(item: OfflineQueueItem): Promise<void> {
    try {
      // Update status to processing
      await this.supabase
        .from('offline_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      // Process based on action type
      switch (item.action_type) {
        case 'create':
          await this.handleCreate(item);
          break;
        case 'update':
          await this.handleUpdate(item);
          break;
        case 'delete':
          await this.handleDelete(item);
          break;
      }

      // Mark as completed
      await this.supabase
        .from('offline_queue')
        .update({ status: 'completed' })
        .eq('id', item.id);
    } catch (error) {
      console.error(`Failed to process queue item ${item.id}:`, error);
      
      // Update status to failed and increment retry count
      await this.supabase
        .from('offline_queue')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          retry_count: item.retry_count + 1
        })
        .eq('id', item.id);
    }
  }

  private async handleCreate(item: OfflineQueueItem): Promise<void> {
    const { resource_type, payload } = item;
    const endpoint = `/api/${resource_type}s`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${resource_type}`);
    }
  }

  private async handleUpdate(item: OfflineQueueItem): Promise<void> {
    const { resource_type, resource_id, payload } = item;
    if (!resource_id) throw new Error('Resource ID required for update');
    
    const endpoint = `/api/${resource_type}s/${resource_id}`;
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${resource_type}`);
    }
  }

  private async handleDelete(item: OfflineQueueItem): Promise<void> {
    const { resource_type, resource_id } = item;
    if (!resource_id) throw new Error('Resource ID required for delete');
    
    const endpoint = `/api/${resource_type}s/${resource_id}`;
    
    const response = await fetch(endpoint, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete ${resource_type}`);
    }
  }

  async retryFailedItems(): Promise<void> {
    if (!this.profileId) {
      console.error('Profile ID not available');
      return;
    }

    try {
      const { data: failedItems, error: fetchError } = await this.supabase
        .from('offline_queue')
        .select('*')
        .eq('profile_id', this.profileId)
        .eq('status', 'failed')
        .lt('retry_count', 3) // Only retry items that haven't exceeded retry limit
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      for (const item of failedItems) {
        // Reset status to pending for retry
        await this.supabase
          .from('offline_queue')
          .update({ status: 'pending' })
          .eq('id', item.id);
      }

      // Process the queue again
      await this.processQueue();
    } catch (error) {
      console.error('Failed to retry failed items:', error);
    }
  }
}

// Export a singleton instance
export const offlineQueue = new OfflineQueue(); 