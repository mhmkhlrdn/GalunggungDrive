import { useState, useEffect, useRef, useCallback } from 'react';
import { File, Image, Video, Music, FileText, Archive } from 'lucide-react';

interface FilePreviewProps {
    file: {
        id: number;
        name: string;
        mime_type: string;
    };
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    lazy?: boolean;
    priority?: boolean;
}

export default function FilePreview({ file, size = 'md', className = '', lazy = true, priority = false }: FilePreviewProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(!lazy || priority);
    const [hasLoaded, setHasLoaded] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<AbortController | null>(null);

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return Image;
        if (mimeType.startsWith('video/')) return Video;
        if (mimeType.startsWith('audio/')) return Music;
        if (mimeType === 'application/pdf') return FileText;
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return Archive;
        return File;
    };

    const getFileColor = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return 'text-green-600';
        if (mimeType.startsWith('video/')) return 'text-purple-600';
        if (mimeType.startsWith('audio/')) return 'text-pink-600';
        if (mimeType === 'application/pdf') return 'text-red-600';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'text-orange-600';
        return 'text-slate-600';
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'w-12 h-12';
            case 'md':
                return 'w-16 h-16';
            case 'lg':
                return 'w-20 h-20';
            default:
                return 'w-16 h-16';
        }
    };

    const getIconSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'h-6 w-6';
            case 'md':
                return 'h-8 w-8';
            case 'lg':
                return 'h-8 w-8';
            default:
                return 'h-8 w-8';
        }
    };

    const isImage = file.mime_type.startsWith('image/');
    const isVideo = file.mime_type.startsWith('video/');
    const showPreview = (isImage || isVideo) && !hasError && isVisible;

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!lazy || priority || isVisible) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before element comes into view
                threshold: 0.1
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [lazy, priority, isVisible]);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    const handleError = useCallback(() => {
        setIsLoading(false);
        setHasError(true);
    }, []);

    // Load preview when visible
    useEffect(() => {
        if (!showPreview || hasLoaded) return;

        let objectUrl: string | null = null;

        const loadPreview = async () => {
            setIsLoading(true);
            setHasError(false);

            // Cancel any existing request
            if (controllerRef.current) {
                controllerRef.current.abort();
            }

            controllerRef.current = new AbortController();
            const { signal } = controllerRef.current;

            const handleAbort = () => {
                try {
                    controllerRef.current?.abort();
                } catch {
                    // ignore
                }
            };

            // Listen for navigation events
            const onAppNavigationStart = () => handleAbort();
            document.addEventListener('app:navigation-start', onAppNavigationStart);
            window.addEventListener('pagehide', handleAbort);
            window.addEventListener('beforeunload', handleAbort);

            try {
                const res = await fetch(`/files/${file.id}/preview`, {
                    credentials: 'include',
                    signal
                });

                if (!res.ok) throw new Error(`Preview request failed: ${res.status}`);

                const blob = await res.blob();
                objectUrl = URL.createObjectURL(blob);
                setSrcUrl(objectUrl);
                setHasLoaded(true);
            } catch (e) {
                const errName = e instanceof Error ? e.name : String((e as unknown) || '');
                if (errName === 'AbortError') {
                    setIsLoading(false);
                    return;
                }
                console.error('Preview fetch failed for file', file.id, e);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }

            return () => {
                window.removeEventListener('pagehide', handleAbort);
                window.removeEventListener('beforeunload', handleAbort);
                document.removeEventListener('app:navigation-start', onAppNavigationStart);
                try {
                    controllerRef.current?.abort();
                } catch {
                    // ignore
                }
                if (objectUrl) URL.revokeObjectURL(objectUrl);
            };
        };

        loadPreview();
    }, [file.id, showPreview, hasLoaded]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
            if (srcUrl) {
                URL.revokeObjectURL(srcUrl);
            }
        };
    }, [srcUrl]);

    if (isImage || isVideo) {
        return (
            <div
                ref={elementRef}
                className={`relative ${getSizeClasses()} rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center ${className}`}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-2 border-blue-500" />
                    </div>
                )}
                {showPreview ? (
                    isImage ? (
                        <img
                            src={srcUrl ?? undefined}
                            alt={file.name}
                            className={`w-full h-full object-cover transition-opacity duration-200`}
                            style={{ opacity: isLoading ? 0 : 1 }}
                            onLoad={handleLoad}
                            onError={handleError}
                            loading="eager"
                            decoding="async"
                        />
                    ) : (
                        <video
                            src={srcUrl ?? undefined}
                            className={`w-full h-full object-cover transition-opacity duration-200`}
                            style={{ opacity: isLoading ? 0 : 1 }}
                            onLoadedData={handleLoad}
                            onError={handleError}
                            controls={false}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                        />
                    )
                ) : (
                    <IconComponent className={`${getIconSizeClasses()} ${getFileColor(file.mime_type)}`} />
                )}
            </div>
        );
    }

    const IconComponent = getFileIcon(file.mime_type);

    return (
        <div className={`${getSizeClasses()} rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center ${className}`}>
            <IconComponent className={`${getIconSizeClasses()} ${getFileColor(file.mime_type)}`} />
        </div>
    );
}

