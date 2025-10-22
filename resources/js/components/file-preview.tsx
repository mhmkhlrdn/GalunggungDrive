import { useState, useEffect } from 'react';
import { File, Image, Video, Music, FileText, Archive } from 'lucide-react';

interface FilePreviewProps {
    file: {
        id: number;
        name: string;
        mime_type: string;
    };
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function FilePreview({ file, size = 'md', className = '' }: FilePreviewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

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
    const showPreview = (isImage || isVideo) && !hasError;
    const IconComponent = getFileIcon(file.mime_type);

    const [srcUrl, setSrcUrl] = useState<string | null>(null);

    const handleLoad = () => setIsLoading(false);
    const handleError = () => { setIsLoading(false); setHasError(true); };

    useEffect(() => {
        let objectUrl: string | null = null;

        // Only attempt fetch for previewable types
        if (showPreview) {
            setIsLoading(true);
            setHasError(false);

            const controller = new AbortController();
            const { signal } = controller;

            const handleAbort = () => {
                try {
                    controller.abort();
                } catch {
                    // ignore
                }
            };

            // Allow other parts of the app to signal a real navigation start so
            // previews can be aborted immediately (without listening to noisy
            // SPA events globally). This avoids spurious aborts but still
            // prioritizes navigation when the app dispatches the event.
            const onAppNavigationStart = () => handleAbort();
            document.addEventListener('app:navigation-start', onAppNavigationStart);

            // Abort preview fetch when page is being unloaded/hidden so
            // navigation isn't postponed by in-flight requests. Avoid aborting
            // on SPA history/popstate or Inertia start events because those can
            // be triggered without an actual navigation and cause spurious
            // cancellations of thumbnail requests.
            window.addEventListener('pagehide', handleAbort);
            window.addEventListener('beforeunload', handleAbort);

            (async () => {
                try {
                    const res = await fetch(`/files/${file.id}/preview`, { credentials: 'include', signal });
                    if (!res.ok) throw new Error(`Preview request failed: ${res.status}`);
                    const blob = await res.blob();
                    objectUrl = URL.createObjectURL(blob);
                    setSrcUrl(objectUrl);
                    // let the normal onLoad/onLoadedData handle marking loaded
                } catch (e) {
                    // Ignore abort errors - they indicate navigation or unmount
                    // 'e' is unknown here, check its name property defensively
                    const errName = e instanceof Error ? e.name : String((e as unknown) || '');
                    if (errName === 'AbortError') {
                        // stop showing spinner so navigation can proceed immediately
                        setIsLoading(false);
                        return;
                    }
                    console.error('Preview fetch failed for file', file.id, e);
                    handleError();
                }
            })();

            return () => {
                // Clean up listeners and revoke object URL
                window.removeEventListener('pagehide', handleAbort);
                window.removeEventListener('beforeunload', handleAbort);
                document.removeEventListener('app:navigation-start', onAppNavigationStart);
                try {
                    controller.abort();
                } catch {
                    // ignore
                }
                if (objectUrl) URL.revokeObjectURL(objectUrl);
            };
        }

        return () => {};
    }, [file.id, showPreview]);

    if (isImage || isVideo) {
        return (
            <div className={`relative ${getSizeClasses()} rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center ${className}`}>
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
                            // avoid native lazy loading when we fetch blob manually
                            loading="eager"
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

    return (
        <div className={`${getSizeClasses()} rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center ${className}`}>
            <IconComponent className={`${getIconSizeClasses()} ${getFileColor(file.mime_type)}`} />
        </div>
    );
}

