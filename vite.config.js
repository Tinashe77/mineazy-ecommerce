import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Ensure this points to your `src` directory
    },
  },
  esbuild: {
    target: 'es2020' // This enables optional chaining
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://mining-equipment-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
  
});
