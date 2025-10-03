import React, { createContext, useContext, useState, ReactNode } from 'react';
import Snackbar from '@/components/ui/snackbar';

interface SnackbarMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

interface SnackbarContextType {
    showSnackbar: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};

interface SnackbarProviderProps {
    children: ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
    const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

    const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info', duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newSnackbar: SnackbarMessage = { id, message, type, duration };

        setSnackbars(prev => [...prev, newSnackbar]);
    };

    const removeSnackbar = (id: string) => {
        setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
    };

    const showSuccess = (message: string, duration?: number) => {
        showSnackbar(message, 'success', duration);
    };

    const showError = (message: string, duration?: number) => {
        showSnackbar(message, 'error', duration);
    };

    const showWarning = (message: string, duration?: number) => {
        showSnackbar(message, 'warning', duration);
    };

    const showInfo = (message: string, duration?: number) => {
        showSnackbar(message, 'info', duration);
    };

    const contextValue: SnackbarContextType = {
        showSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <SnackbarContext.Provider value={contextValue}>
            {children}
            <div className="pointer-events-none fixed top-4 right-4 z-50 flex max-h-[90vh] w-full max-w-sm flex-col items-end space-y-2 overflow-y-auto pr-1">
                {snackbars.map((snackbar, index) => (
                    <div
                        key={snackbar.id}
                        className="pointer-events-auto"
                    >
                        <Snackbar
                            message={snackbar.message}
                            type={snackbar.type}
                            isOpen={true}
                            onClose={() => removeSnackbar(snackbar.id)}
                            duration={snackbar.duration}
                            position="top-right"
                        />
                    </div>
                ))}
            </div>
        </SnackbarContext.Provider>
    );
};
