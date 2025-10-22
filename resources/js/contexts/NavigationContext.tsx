import React, { createContext, useContext, useState, useEffect } from 'react';

interface NavigationContextType {
    isNavigating: boolean;
    setIsNavigating: (navigating: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const handleNavigationStart = () => {
            setIsNavigating(true);
        };

        const handleNavigationEnd = () => {
            setIsNavigating(false);
        };

        // Listen for Inertia navigation events
        document.addEventListener('inertia:start', handleNavigationStart);
        document.addEventListener('inertia:finish', handleNavigationEnd);
        document.addEventListener('app:navigation-start', handleNavigationStart);
        document.addEventListener('app:navigation-end', handleNavigationEnd);

        return () => {
            document.removeEventListener('inertia:start', handleNavigationStart);
            document.removeEventListener('inertia:finish', handleNavigationEnd);
            document.removeEventListener('app:navigation-start', handleNavigationStart);
            document.removeEventListener('app:navigation-end', handleNavigationEnd);
        };
    }, []);

    return (
        <NavigationContext.Provider value={{ isNavigating, setIsNavigating }}>
            {children}
        </NavigationContext.Provider>
    );
};
