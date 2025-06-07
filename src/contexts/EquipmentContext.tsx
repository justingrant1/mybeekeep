import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Define equipment types (matches schema)
export interface Equipment {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  condition: 'new' | 'good' | 'fair' | 'poor';
  purchase_date?: string;
  created_at: string;
}

// Define the equipment context type
interface EquipmentContextType {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  addEquipment: (item: Omit<Equipment, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Omit<Equipment, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
}

// Create the context with default values
const EquipmentContext = createContext<EquipmentContextType>({
  equipment: [],
  loading: false,
  error: null,
  addEquipment: async () => {},
  updateEquipment: async () => {},
  deleteEquipment: async () => {},
});

// Hook to use the equipment context
export const useEquipment = () => useContext(EquipmentContext);

// Provider component
export const EquipmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isPremium } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    if (!user || !isPremium) {
      setEquipment([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setEquipment(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch equipment';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, isPremium]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  // Add a new equipment item
  const addEquipment = async (item: Omit<Equipment, 'id' | 'user_id' | 'created_at'>) => {
    if (!user || !isPremium) {
      setError('Only premium users can add equipment.');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .insert([{ ...item, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setEquipment(prev => [...prev, data]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add equipment';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update an equipment item
  const updateEquipment = async (id: string, updates: Partial<Omit<Equipment, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user || !isPremium) {
      setError('Only premium users can update equipment.');
      return;
    }
      
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setEquipment(prev =>
          prev.map(item => (item.id === id ? data : item))
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update equipment';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete an equipment item
  const deleteEquipment = async (id: string) => {
    if (!user || !isPremium) {
      setError('Only premium users can delete equipment.');
      return;
    }
      
    try {
      setLoading(true);
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setEquipment(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete equipment';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <EquipmentContext.Provider
      value={{
        equipment,
        loading,
        error,
        addEquipment,
        updateEquipment,
        deleteEquipment,
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
};
