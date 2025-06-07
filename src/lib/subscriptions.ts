import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type SubscriptionCallback<T> = (payload: {
  new: T | null;
  old: T | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}) => void;

/**
 * Subscribe to changes in a table
 * 
 * @param table The table to subscribe to
 * @param event The event to subscribe to ('INSERT', 'UPDATE', 'DELETE', or '*')
 * @param filter Optional filter string (e.g., 'id=eq.123')
 * @param callback Function to call when changes occur
 * @returns Function to unsubscribe
 */
export const subscribeToTable = <T extends Record<string, any>>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: SubscriptionCallback<T>,
  filter?: string,
  schema: string = 'public'
): () => void => {
  // Generate a unique channel name
  const channelName = `${schema}.${table}.${event}.${filter || '*'}.${Date.now()}`;
  
  // Create the channel
  const channel = supabase.channel(channelName);
  
  // Configure the channel to listen for Postgres changes
  channel
    .on(
      'postgres_changes',
      {
        event: event === '*' ? undefined : event,
        schema: schema,
        table: table,
        filter: filter,
      },
      (payload) => {
        callback({
          new: payload.new as T || null,
          old: payload.old as T || null, 
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        });
      }
    )
    .subscribe();
  
  // Return a function to unsubscribe
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to changes to a specific record by ID
 */
export const subscribeToRecord = <T extends Record<string, any>>(
  table: string,
  id: string,
  callback: SubscriptionCallback<T>
): () => void => {
  return subscribeToTable<T>(
    table,
    '*',
    callback,
    `id=eq.${id}`
  );
};

/**
 * Subscribe to all records for a specific user
 */
export const subscribeToUserRecords = <T extends Record<string, any>>(
  table: string,
  userId: string,
  callback: SubscriptionCallback<T>
): () => void => {
  return subscribeToTable<T>(
    table,
    '*',
    callback,
    `user_id=eq.${userId}`
  );
};

/**
 * Subscribe to all records in a hive
 */
export const subscribeToHiveRecords = <T extends Record<string, any>>(
  table: string,
  hiveId: string,
  callback: SubscriptionCallback<T>
): () => void => {
  return subscribeToTable<T>(
    table,
    '*',
    callback,
    `hive_id=eq.${hiveId}`
  );
};

/**
 * Subscribe to changes in child records related to a parent record
 */
export const subscribeToChildRecords = <T extends Record<string, any>>(
  table: string,
  foreignKey: string,
  parentId: string,
  callback: SubscriptionCallback<T>
): () => void => {
  return subscribeToTable<T>(
    table,
    '*',
    callback,
    `${foreignKey}=eq.${parentId}`
  );
};
