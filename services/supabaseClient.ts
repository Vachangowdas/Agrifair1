
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Only initialize if we have the required credentials.
// This prevents the "Uncaught Error: supabaseUrl is required" fatal error.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn(
    'Supabase credentials missing. Database operations will be disabled. ' +
    'Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.'
  );
}
