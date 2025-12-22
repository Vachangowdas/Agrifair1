
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Try to get the API key from common variable names
  const apiKey = env.VITE_API_KEY || env.API_KEY || "";
  
  // Get the Blob token from environment or fallback to the provided value
  const blobToken = env.VITE_BLOB_READ_WRITE_TOKEN || env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_nLQ75mIE13blhjTO_GmUPbouo43IF265wR6sHJU7LlVqUCg";

  // Supabase connection details (Assuming they will be injected by Vercel Integration or .env)
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.BLOB_READ_WRITE_TOKEN': JSON.stringify(blobToken),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    }
  }
})
