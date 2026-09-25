import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works wherever it's hosted
  // (GitHub Pages project path, custom domain, or a sub-path like /todo).
  base: './',
});
