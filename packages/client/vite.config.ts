import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    target: 'es2017', // PS4 WebKit floor
    assetsInlineLimit: 0,
  },
  server: {
    fs: { allow: ['../..'] },
    proxy: {
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
});
