import { create } from 'zustand';
import { supabase, User } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true });
      
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userData: User = {
            id: user.id,
            email: user.email,
          };
          
          set({ user: userData, session: session });
        }
      }
      
      // Set up auth state change listener
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session: session });
        
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email,
          };
          set({ user: userData });
        } else {
          set({ user: null });
        }
      });
      
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      set({ loading: false });
    }
  },
}));