import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthSession, Profile } from '../types';
import { db } from '../lib/db';

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error: Error | null }>;
  signUp: (email: string, password?: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error: Error | null }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: Error | null }>;
  logout: () => Promise<void>;
  updateProfileState: (updated: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const s = await db.getSession();
        setSession(s);
      } catch (e) {
        console.error('Failed to restore auth session', e);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const { session: s, error } = await db.login(email, password);
      if (error) {
        setLoading(false);
        return { success: false, error };
      }
      setSession(s);
      setLoading(false);
      return { success: true, error: null };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err };
    }
  };

  const signUp = async (email: string, password?: string, firstName?: string, lastName?: string) => {
    setLoading(true);
    try {
      const { session: s, error } = await db.signUp(email, password, firstName, lastName);
      if (error) {
        setLoading(false);
        return { success: false, error };
      }
      setSession(s);
      setLoading(false);
      return { success: true, error: null };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err };
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { success, error } = await db.resetPassword(email);
      setLoading(false);
      return { success, error };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await db.logout();
      setSession(null);
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileState = (updated: Partial<Profile>) => {
    if (session && session.profile) {
      setSession({
        ...session,
        profile: {
          ...session.profile,
          ...updated
        }
      });
    }
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, signUp, resetPassword, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
