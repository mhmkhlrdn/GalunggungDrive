import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { Ziggy } from './ziggy';
import {route} from 'ziggy-js';

declare global {
    interface Window {
        Ziggy: typeof Ziggy;
        route: typeof route;
        Inertia: {
            onStart: (callback: () => void) => void;
            cancel: () => void;
            visit: (url: string, options?: object) => void;
        };
        Auth: import('./types').Auth;
    }
}



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

        // Initialize window.Auth with user data
        window.Auth = (props.initialPage.props as unknown as import('./types').SharedData).auth;

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

// Cancel any previous Inertia requests when a new one starts
if (window.Inertia) {
    window.Inertia.onStart(() => window.Inertia.cancel());
}

initializeTheme();
