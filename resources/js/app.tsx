import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { Ziggy } from './ziggy';
import {route} from 'ziggy-js';

const appName = import.meta.env.VITE_APP_NAME || 'Galunggung Drive';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // ✅ Make Ziggy available globally (optional)
        window.Ziggy = Ziggy;
        window.route = route;

        root.render(
            <SnackbarProvider>
                <App {...props} />
            </SnackbarProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
