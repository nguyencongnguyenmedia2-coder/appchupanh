import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-dexie': ['dexie', 'dexie-react-hooks'],
          'vendor-pdf': ['jspdf'],
          'vendor-zip': ['jszip', 'file-saver'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
