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

    useEffect(() => {
        // Reset loading and error states when file changes
        setIsLoading(true);
        setHasError(false);
    }, [file.id]);

    useEffect(() => {
        console.log(`[FilePreview] File ID: ${file.id}, Name: ${file.name}, isLoading: ${isLoading}, hasError: ${hasError}`);
    }, [isLoading, hasError, file.id, file.name]);

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

    const handleLoad = () => setIsLoading(false);
    const handleError = () => { setIsLoading(false); setHasError(true); };

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
                            src={`/files/${file.id}/preview`}
                            alt={file.name}
                            className={`w-full h-full object-cover ${isLoading ? 'hidden' : ''}`}
                            onLoad={handleLoad}
                            onError={handleError}
                        />
                    ) : (
                        <video
                            src={`/files/${file.id}/preview`}
                            className={`w-full h-full object-cover ${isLoading ? 'hidden' : ''}`}
                            onLoad={handleLoad}
                            onError={handleError}
                            controls={false}
                            muted
                            loop
                            playsInline
                            preload="none"
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

