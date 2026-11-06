import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// Dedicated single owner account for the application
export const OWNER_USER_ID = '4301fe1d-88cc-4782-8aa9-2a334637dd7e';
export const OWNER_EMAIL = 'owner@rideledger.app';
export const OWNER_PASSWORD = 'rideledger-owner-secret-pass-2025';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
}

interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  enableGuestMode: () => void;
}

const defaultOwnerUser: AuthUser = {
  id: OWNER_USER_ID,
  email: OWNER_EMAIL,
  fullName: 'RideLedger Rider',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(defaultOwnerUser);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && session.user.id === OWNER_USER_ID) {
            setUser(mapSupabaseUser(session.user));
          } else {
            // Silently authenticate as single owner across all devices
            const { data: signData, error } = await supabase.auth.signInWithPassword({
              email: OWNER_EMAIL,
              password: OWNER_PASSWORD,
            });
            if (!error && signData.user) {
              setUser(mapSupabaseUser(signData.user));
            } else {
              setUser(defaultOwnerUser);
            }
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              setUser(mapSupabaseUser(session.user));
            } else {
              setUser(defaultOwnerUser);
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } catch (err) {
          console.warn('Auto-auth notice:', err);
          setUser(defaultOwnerUser);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(defaultOwnerUser);
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const mapSupabaseUser = (u: User): AuthUser => ({
    id: u.id,
    email: u.email || OWNER_EMAIL,
    fullName: u.user_metadata?.full_name || 'RideLedger Rider',
  });

  const signUp = async () => ({ error: null });
  const signIn = async () => ({ error: null });
  const signOut = async () => {};
  const resetPassword = async () => ({ error: null });
  const enableGuestMode = () => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        enableGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
