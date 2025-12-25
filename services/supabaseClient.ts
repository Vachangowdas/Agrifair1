
import { createClient } from '@supabase/supabase-js';

// Support both standard and Vercel-specific environment variable prefixes
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20
);

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const getDbStatus = () => ({
  isCloud: !!supabase,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Not Configured'
});

if (!supabase) {
  console.info(
    '%c[AgriFair] LOCAL MODE: Supabase variables missing in Vercel/Env.',
    'color: #eab308; font-weight: bold; background: #fffbeb; padding: 4px; border-radius: 4px;'
  );
} else {
  console.info(
    '%c[AgriFair] CLOUD MODE: Supabase Connected.',
    'color: #16a34a; font-weight: bold; background: #f0fdf4; padding: 4px; border-radius: 4px;'
  );
}
