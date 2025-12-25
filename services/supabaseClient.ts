
import { createClient } from '@supabase/supabase-js';

/**
 * Utility to safely retrieve environment variables in a browser environment.
 * Checks Vite's process.env replacement and native import.meta.env.
 */
const getEnvVar = (key: string): string => {
  try {
    // 1. Check process.env (Vite's define replacement)
    if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
      return (process.env as any)[key];
    }
  } catch (e) {}

  try {
    // 2. Check import.meta.env (Standard Vite way)
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      // Try with and without VITE_ prefix
      return metaEnv[`VITE_${key}`] || metaEnv[key] || "";
    }
  } catch (e) {}

  return "";
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

// Log status for debugging (Masking keys for security)
const mask = (str: string) => (str && str.length > 8) ? `${str.substring(0, 8)}...` : "MISSING";

console.log('[AgriFair] Cloud Environment Diagnostics:', {
  url: mask(supabaseUrl),
  key: mask(supabaseAnonKey),
  hasProtocol: supabaseUrl.startsWith('http')
});

// Validation for initialization
const canConnect = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

/**
 * The Supabase client instance. 
 * Will be null if environment variables are missing or invalid.
 */
export const supabase = canConnect 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn(
    '[AgriFair] NOTICE: Supabase Client is NULL. Application is running in "Local Mode".\n' +
    'To enable Cloud Sync, ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your hosting provider (Vercel/Netlify).'
  );
} else {
  console.log('[AgriFair] Supabase Client ready for Cloud Sync.');
}

export const getDbStatus = () => ({
  isCloud: !!supabase,
  urlSet: !!supabaseUrl,
  keySet: !!supabaseAnonKey,
  urlValid: supabaseUrl.startsWith('http'),
  debugInfo: {
    urlLength: supabaseUrl.length,
    keyLength: supabaseAnonKey.length
  }
});
