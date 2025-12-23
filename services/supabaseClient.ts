
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== "");

// Only initialize if we have the required credentials.
export const supabase = isConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

if (!supabase) {
  console.info(
    '%c[AgriFair] Database running in LOCAL STORAGE mode. Provide SUPABASE_URL and SUPABASE_ANON_KEY to enable cloud database.',
    'color: #eab308; font-weight: bold; padding: 4px;'
  );
} else {
  console.info(
    '%c[AgriFair] Database running in SUPABASE mode. Sync Enabled.',
    'color: #16a34a; font-weight: bold; padding: 4px;'
  );
}
