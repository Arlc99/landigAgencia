import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/landigAgencia/',
  build: {
    outDir: 'docs',   // 👈 Vite genera en /docs en vez de /dist
  },
});
