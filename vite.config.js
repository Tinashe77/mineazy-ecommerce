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
  }
});
