import react from '@vitejs/plugin-react';
import process from 'node:process';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // GitHub Pages demosu alt dizinde yayınlanır. Portal sunucusunda kök dizinden
    // yayınlanacaksa build sırasında VITE_BASE_PATH=/ verilir.
    base: env.VITE_BASE_PATH || '/sanayi-portali-frontend/',
    server: {
      // Geliştirmede /api isteklerini yerel backend'e yönlendirir (VITE_USE_MOCK=false iken)
      proxy: env.API_PROXY_TARGET
        ? { '/api': { target: env.API_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
  };
});
