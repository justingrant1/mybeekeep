import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

// Define the notification type based on schema
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'inspection' | 'harvest' | 'treatment' | 'system' | 'alert';
  read: boolean;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

// Define the notification context type
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

// Create the context with default values
const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearAll: async () => {},
});

// Hook to use the notifications context
export const useNotifications = () => useContext(NotificationsContext);

// Provider component
export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const unreadCount = notifications.filter(notif => !notif.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel: RealtimeChannel = supabase
      .channel(`public:notifications:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.read) return;

    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert UI change on error
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, read: false } : notif))
      );
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Revert UI change on error
      setNotifications(prev =>
        prev.map(notif => unreadIds.includes(notif.id) ? { ...notif, read: false } : notif)
      );
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    const allIds = notifications.map(n => n.id);
    if (allIds.length === 0) return;

    const originalNotifications = [...notifications];
    setNotifications([]);

    try {
      await supabase
        .from('notifications')
        .delete()
        .in('id', allIds);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      // Revert UI change on error
      setNotifications(originalNotifications);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
