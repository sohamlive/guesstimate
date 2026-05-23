import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// If credentials exist, initialize client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const hasSupabaseConfig = () => {
  return !!supabase;
};
