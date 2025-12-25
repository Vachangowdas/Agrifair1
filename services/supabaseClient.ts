
import { createClient } from '@supabase/supabase-js';

// Environment variables are injected via vite.config.ts
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 10
);

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.error(
    '[AgriFair Error] Supabase is NOT connected. Please check your Environment Variables (SUPABASE_URL, SUPABASE_ANON_KEY).'
  );
} else {
  console.log('[AgriFair] Supabase connection established.');
}

export const getDbStatus = () => ({
  isCloud: !!supabase,
  urlSet: !!supabaseUrl,
  keySet: !!supabaseAnonKey,
  urlValid: supabaseUrl.startsWith('http')
});
