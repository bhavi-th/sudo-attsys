import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true, // This is mandatory to see the manifest in dev mode
            },
            manifest: {
                id: '/',
                name: 'ATTSYS 2.0',
                short_name: 'ATTSYS 2.0',
                description: 'Automated Attendance Ecosystem',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: 'logo256.png', // No leading slash here
                        sizes: '256x256',
                        type: 'image/png',
                    },
                    {
                        src: 'logo512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
                screenshots: [
                    {
                        src: 'screenshot-wide.png',

                        sizes: '2560x1440',

                        type: 'image/png',

                        form_factor: 'wide',

                        label: 'Desktop Dashboard',
                    },

                    {
                        src: 'screenshot-mobile.png',

                        sizes: '1500x2668',

                        type: 'image/png',

                        form_factor: 'narrow',

                        label: 'Mobile View',
                    },
                ],
            },
        }),
    ],
});
