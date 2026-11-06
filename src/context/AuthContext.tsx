import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { generateUUID } from '@/lib/utils/uuid';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  enableGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(mapSupabaseUser(session.user));
          } else {
            // Check for locally stored guest session
            const savedUser = localStorage.getItem('rideledger_offline_user');
            if (savedUser) {
              setUser(JSON.parse(savedUser));
            } else {
              setUser(null);
            }
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              setUser(mapSupabaseUser(session.user));
            } else {
              const savedUser = localStorage.getItem('rideledger_offline_user');
              if (savedUser) {
                setUser(JSON.parse(savedUser));
              } else {
                setUser(null);
              }
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } catch {
          const savedUser = localStorage.getItem('rideledger_offline_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Local-first mode when Supabase credentials are not provided
        const savedUser = localStorage.getItem('rideledger_offline_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const mapSupabaseUser = (u: User): AuthUser => ({
    id: u.id,
    email: u.email || '',
    fullName: u.user_metadata?.full_name || null,
  });

  const signUp = async (email: string, password: string, fullName: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) return { error: error.message };

        localStorage.removeItem('rideledger_offline_user');

        if (data.session?.user) {
          setUser(mapSupabaseUser(data.session.user));
          return { error: null };
        } else if (data.user) {
          // Attempt immediate sign in in case email confirmation is auto-confirmed
          const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!signError && signData.user) {
            setUser(mapSupabaseUser(signData.user));
            return { error: null };
          }
          return { error: 'Account created! Please check your email to confirm, then sign in.' };
        }
        return { error: null };
      } catch (err: any) {
        return { error: err.message || 'Sign up failed' };
      }
    } else {
      const newUser: AuthUser = {
        id: generateUUID(),
        email,
        fullName,
      };
      localStorage.setItem('rideledger_offline_user', JSON.stringify(newUser));
      setUser(newUser);
      return { error: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: error.message };
        if (data.user) {
          localStorage.removeItem('rideledger_offline_user');
          setUser(mapSupabaseUser(data.user));
        }
        return { error: null };
      } catch (err: any) {
        return { error: err.message || 'Sign in failed' };
      }
    } else {
      const newUser: AuthUser = {
        id: generateUUID(),
        email,
        fullName: email.split('@')[0],
      };
      localStorage.setItem('rideledger_offline_user', JSON.stringify(newUser));
      setUser(newUser);
      return { error: null };
    }
  };

  const enableGuestMode = () => {
    const guest: AuthUser = {
      id: generateUUID(),
      email: 'guest@rideledger.local',
      fullName: 'Guest Rider',
    };
    localStorage.setItem('rideledger_offline_user', JSON.stringify(guest));
    setUser(guest);
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem('rideledger_offline_user');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) return { error: error.message };
        return { error: null };
      } catch (err: any) {
        return { error: err.message || 'Password reset failed' };
      }
    } else {
      return { error: null };
    }
  };

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


