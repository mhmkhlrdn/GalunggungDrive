import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    // base: 'http://192.168.1.17:5173/',
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
    optimizeDeps: {
        force: true,
        include: ['@radix-ui/react-switch', '@inertiajs/react']
    },

  server: {
  host: '0.0.0.0',
  port: 5173,
  strictPort:true,
  cors: {
    origin: 'http://127.0.0.1',
    credentials: true,
  },
  hmr: {
    protocol: 'ws',
    host: '127.0.0.1',
    port: 5173,
  },
},


    preview: {
        // host: '192.168.1.17',
        port: 5173,
    },
});
