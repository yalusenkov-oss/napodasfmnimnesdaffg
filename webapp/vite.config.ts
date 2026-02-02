import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Объединённая конфигурация Vite (всё в одном экспорте)
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],

  // Для разработки — проксируем API
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  // Для продакшена — собираем в dist
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
