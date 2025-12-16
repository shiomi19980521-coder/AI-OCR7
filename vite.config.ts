import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // DEBUG: Log environment variables during build
  console.log('=== VITE BUILD TIME ENV CHECK ===');
  console.log('Mode:', mode);
  console.log('process.env.VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? 'EXISTS (length: ' + process.env.VITE_GEMINI_API_KEY.length + ')' : 'MISSING');
  console.log('env.VITE_GEMINI_API_KEY:', env.VITE_GEMINI_API_KEY ? 'EXISTS (length: ' + env.VITE_GEMINI_API_KEY.length + ')' : 'MISSING');
  console.log('=================================');

  return {
    define: {
      // Explicitly inject the variable from process.env (Vercel) to client-side
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
