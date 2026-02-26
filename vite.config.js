import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    // When this repo is used as a git submodule at theme/, ../assets/dist
    // resolves to the site repo's own assets/dist directory — keeping
    // all production URLs at /assets/dist/... with no /theme/ prefix.
    outDir: resolve(__dirname, '../assets/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.js'),
      },
      external: ['/pagefind/pagefind.js'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  server: {
    port: 3000,
    origin: 'http://localhost:3000',
  },
  plugins: [],
});
