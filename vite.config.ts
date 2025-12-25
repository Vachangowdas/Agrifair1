
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load variables from .env files
  const envFile = loadEnv(mode, (process as any).cwd(), '');
  
  // Create a merged environment object prioritizing system/Vercel process.env
  // over .env files for production reliability.
  const env = { ...envFile, ...process.env };
  
  // Consolidate API Keys with fallback support
  const apiKey = env.VITE_API_KEY || env.API_KEY || "";
  
  const supabaseUrl = 
    env.VITE_SUPABASE_URL || 
    env.SUPABASE_URL || 
    env.NEXT_PUBLIC_SUPABASE_URL || 
    "";

  const supabaseAnonKey = 
    env.VITE_SUPABASE_ANON_KEY || 
    env.SUPABASE_ANON_KEY || 
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    "";

  return {
    plugins: [react()],
    define: {
      // Explicitly stringify variables for Vite to replace them in the source code
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.NODE_ENV': JSON.stringify(mode),
    }
  }
})
