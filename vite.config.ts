import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    base: 'http://192.168.17.144:5173/',
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
  server: {
  host: '0.0.0.0',
  port: 5173,
  cors: {
    origin: 'http://192.168.17.144:8001', // Laravel's URL
    credentials: true,
  },
  hmr: {
    protocol: 'ws',
    host: '192.168.17.144',
    port: 5173,
  },
},


    preview: {
        host: '192.168.17.144',
        port: 5173,
    },
});
