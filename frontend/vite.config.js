import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Dev server proxies /v1 to the backend so there are no CORS surprises locally.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/v1': {
                target: process.env.VITE_API_TARGET || 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
