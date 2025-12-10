import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This allows the code 'process.env.API_KEY' to work in the browser
      // It maps it to the value found in your .env file
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    }
  }
})