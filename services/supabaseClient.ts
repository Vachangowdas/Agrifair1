
import { createClient } from '@supabase/supabase-js';

// Support both standard and Vercel-specific environment variable prefixes
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
  console.warn(
    '[AgriFair] Supabase is NOT configured. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in Vercel environment variables.'
  );
} else {
  console.log('[AgriFair] Supabase client initialized successfully.');
}

export const getDbStatus = () => ({
  isCloud: !!supabase,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});
