import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Define the user profile type
export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  is_premium: boolean;
}

// Define the user type, now including the full profile
export interface User {
  id: string;
  email: string;
  profile: Profile | null;
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  setIsPremium: (isPremium: boolean) => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  signIn: async () => ({ success: false, error: 'Not implemented' }),
  signUp: async () => ({ success: false, error: 'Not implemented' }),
  signOut: async () => {},
  refetchProfile: async () => {},
  setIsPremium: () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Fetch user profile from the database
  const fetchProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      // Return a basic user object if profile fetch fails
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        profile: null,
      };
    }
    
    setIsPremium(profile?.is_premium || false);

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      profile: profile as Profile,
    };
  }, []);
  
  const refetchProfile = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      const updatedUser = await fetchProfile(supabaseUser);
      setUser(updatedUser);
    }
  }, [fetchProfile]);

  // Initialize user session on first load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const fullUser = await fetchProfile(session.user);
          setUser(fullUser);
        } else {
          setUser(null);
          setIsPremium(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const fullUser = await fetchProfile(session.user);
        setUser(fullUser);
      } else {
        setUser(null);
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      // Loading state will be updated by onAuthStateChange
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name } // Ensure this matches the trigger
        }
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      // Loading state will be updated by onAuthStateChange
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Loading state will be updated by onAuthStateChange
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, signIn, signUp, signOut, refetchProfile, setIsPremium }}>
      {children}
    </AuthContext.Provider>
  );
};
