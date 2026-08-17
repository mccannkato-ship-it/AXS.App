import { defineConfig } from 'vite'

const publicEnv = {
  VITE_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}

export default defineConfig({
  appType: 'spa',
  define: Object.fromEntries(Object.entries(publicEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])),
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://127.0.0.1:5174',
    },
  },
})
