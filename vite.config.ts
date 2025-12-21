
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

  return {
    plugins: [react()],
    define: {
      // This allows the code 'process.env.API_KEY' to work in the browser
      // It maps it to the value found in your environment
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.BLOB_READ_WRITE_TOKEN': JSON.stringify(blobToken),
    }
  }
})
