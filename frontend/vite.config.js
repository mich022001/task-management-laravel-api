import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
    },

    plugins: [react(), tailwindcss()],

    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.js',
        restoreMocks: true,
        clearMocks: true,
    },
});
