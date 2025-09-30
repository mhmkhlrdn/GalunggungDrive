import React from 'react';

interface GasnetLogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    showSubtitle?: boolean;
    className?: string;
    variant?: 'default' | 'minimal' | 'full';
}

export default function GasnetLogo({
    size = 'md',
    showText = true,
    showSubtitle = false,
    className = '',
    variant = 'default'
}: GasnetLogoProps) {
    const sizeClasses = {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-10',
        xl: 'h-12'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-xl',
        xl: 'text-2xl'
    };

    const subtitleSizeClasses = {
        sm: 'text-xs',
        md: 'text-xs',
        lg: 'text-sm',
        xl: 'text-sm'
    };

    if (variant === 'minimal') {
        return (
            <img
                src="/imgs/Logo_GASNET.png"
                alt="GASNET Logo"
                className={`${sizeClasses[size]} w-auto object-contain filter drop-shadow-sm hover:drop-shadow-md transition-all duration-200 hover:scale-105 brightness-100 hover:brightness-110 ${className}`}
            />
        );
    }

    if (variant === 'full') {
        return (
            <div className={`flex items-center space-x-3 ${className}`}>
                <img
                    src="/imgs/Logo_GASNET.png"
                    alt="GASNET Logo"
                    className={`${sizeClasses[size]} w-auto object-contain filter drop-shadow-lg hover:drop-shadow-xl transition-all duration-300 hover:scale-110 brightness-100 hover:brightness-110`}
                />
                {/* {showText && (
                    <div className="flex flex-col">
                        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-purple-600 hover:to-blue-600 transition-all duration-300`}>
                            GASNET Drive
                        </span>
                        {showSubtitle && (
                            <span className={`${subtitleSizeClasses[size]} text-slate-600 dark:text-slate-400 font-medium`}>
                                Cloud Storage Solution
                            </span>
                        )}
                    </div>
                )} */}
            </div>
        );
    }

    // Default variant
    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <img
                src="/imgs/Logo_GASNET.png"
                alt="GASNET Logo"
                className={`${sizeClasses[size]} w-auto object-contain filter drop-shadow-sm hover:drop-shadow-md transition-all duration-200 hover:scale-105 brightness-100 hover:brightness-110`}
            />
            {/* {showText && (
                <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-purple-600 hover:to-blue-600 transition-all duration-300`}>
                    GASNET
                </span>
            )} */}
        </div>
    );
}
