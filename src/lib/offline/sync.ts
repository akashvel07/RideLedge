import { getDB } from './db';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { SyncQueueItem } from '@/types/database';

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'retry_count'>) {
  const db = await getDB();
  const queueItem: SyncQueueItem = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    retry_count: 0,
  };
  await db.put('sync_queue', queueItem);
  return queueItem;
}

export async function getPendingSyncCount(): Promise<number> {
  const db = await getDB();
  return await db.count('sync_queue');
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return await db.getAll('sync_queue');
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (!isSupabaseConfigured || !supabase || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const db = await getDB();
  const queue = await db.getAll('sync_queue');
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.operation === 'INSERT') {
        const { error } = await supabase.from(item.table).insert(item.record);
        if (error) throw error;
      } else if (item.operation === 'UPDATE') {
        const { error } = await supabase.from(item.table).update(item.record).eq('id', item.record.id);
        if (error) throw error;
      } else if (item.operation === 'DELETE') {
        const { error } = await supabase.from(item.table).delete().eq('id', item.record.id);
        if (error) throw error;
      }

      // Successfully pushed to Supabase -> remove from local sync queue
      await db.delete('sync_queue', item.id);
      synced++;
    } catch (err: any) {
      failed++;
      item.retry_count = (item.retry_count || 0) + 1;
      item.error = err.message || 'Sync failed';
      await db.put('sync_queue', item);
    }
  }

  return { synced, failed };
}
