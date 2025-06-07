import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for subscribing to real-time updates from Supabase tables
 * 
 * @param table The table to subscribe to
 * @param column Optional column name to filter on
 * @param value Optional value to match for the column filter
 * @returns Loading state and subscription cleanup function
 */
export const useRealtimeSubscription = (
  table: string,
  column?: string, 
  value?: string
): { loading: boolean; unsubscribe: () => void } => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    // Generate a unique channel name
    const channelName = `${table}${column ? `-${column}-${value}` : ''}-${Date.now()}`;
    
    try {
      // Create a channel
      const channel = supabase.channel(channelName);
      
      // Set up the subscription with filter if provided
      const filter = column && value ? `${column}=eq.${value}` : undefined;
      
      channel
        // @ts-ignore - TypeScript doesn't properly recognize the postgres_changes event type
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        }, () => {
          // The callback will be handled at the component level
          // through a separate useEffect watching query results
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setLoading(false);
          }
        });

      // Set up the unsubscribe function
      const unsubscribeFunc = () => {
        supabase.removeChannel(channel);
      };
      
      setSubscription({ unsubscribe: unsubscribeFunc });
      
      // Clean up the subscription when the component unmounts
      return () => {
        unsubscribeFunc();
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      setLoading(false);
      return () => {};
    }
  }, [table, column, value]);

  return { 
    loading,
    unsubscribe: subscription?.unsubscribe || (() => {})
  };
};

/**
 * Custom hook for subscribing to real-time updates for a specific record
 * 
 * @param table The table to subscribe to
 * @param id The id of the record to subscribe to
 * @returns Loading state and subscription cleanup function
 */
export const useRealtimeRecord = (table: string, id: string) => {
  return useRealtimeSubscription(table, 'id', id);
};

/**
 * Custom hook for subscribing to real-time updates for all records owned by a user
 * 
 * @param table The table to subscribe to
 * @param userId The user id to filter by
 * @returns Loading state and subscription cleanup function
 */
export const useRealtimeUserRecords = (table: string, userId: string) => {
  return useRealtimeSubscription(table, 'user_id', userId);
};

/**
 * Custom hook for subscribing to real-time updates for all records in a hive
 * 
 * @param table The table to subscribe to
 * @param hiveId The hive id to filter by
 * @returns Loading state and subscription cleanup function
 */
export const useRealtimeHiveRecords = (table: string, hiveId: string) => {
  return useRealtimeSubscription(table, 'hive_id', hiveId);
};
