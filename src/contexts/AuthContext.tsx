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
  error: string | null;
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
  error: null,
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
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from the database
  const fetchProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User> => {
    console.log('Fetching profile for user:', supabaseUser.id);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
        // Return a basic user object if profile fetch fails
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          profile: null,
        };
      }
      
      console.log('Profile fetched successfully:', profile);
      setIsPremium(profile?.is_premium || false);
      setError(null);

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        profile: profile as Profile,
      };
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        profile: null,
      };
    }
  }, []);
  
  const refetchProfile = useCallback(async () => {
    console.log('Refetching user profile...');
    try {
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      
      if (supabaseUser) {
        const updatedUser = await fetchProfile(supabaseUser);
        setUser(updatedUser);
        console.log('Profile refetched successfully:', updatedUser);
      }
    } catch (err) {
      console.error('Error refetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to refetch user profile');
    }
  }, [fetchProfile]);

  // Initialize user session on first load
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing auth...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          console.log('Session found, fetching user profile...');
          const fullUser = await fetchProfile(session.user);
          setUser(fullUser);
          setError(null);
        } else {
          console.log('No session found');
          setUser(null);
          setIsPremium(false);
          setError(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      try {
        if (session?.user) {
          console.log('New session detected, updating user profile...');
          const fullUser = await fetchProfile(session.user);
          setUser(fullUser);
          setError(null);
        } else {
          console.log('Session ended');
          setUser(null);
          setIsPremium(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error handling auth state change:', err);
        setError(err instanceof Error ? err.message : 'Failed to handle authentication change');
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Sign in successful');
      setError(null);
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Loading state will be updated by onAuthStateChange
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    console.log('Attempting sign up for:', email);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });
      
      if (error) throw error;
      
      console.log('Sign up successful');
      setError(null);
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Loading state will be updated by onAuthStateChange
    }
  };

  // Sign out function
  const signOut = async () => {
    console.log('Attempting sign out...');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Sign out successful');
      setError(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
    } finally {
      // Loading state will be updated by onAuthStateChange
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isPremium, 
      error,
      signIn, 
      signUp, 
      signOut, 
      refetchProfile, 
      setIsPremium 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
