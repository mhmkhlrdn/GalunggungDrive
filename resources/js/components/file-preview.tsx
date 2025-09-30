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
    const showPreview = isImage || isVideo;
    const IconComponent = getFileIcon(file.mime_type);

    if (showPreview) {
        return (
            <div className={`relative ${getSizeClasses()} rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center ${className}`}>
                {isImage ? (
                    <img
                        src={`/files/${file.id}/preview`}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to icon if preview fails
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'block';
                        }}
                    />
                ) : isVideo ? (
                    <video
                        src={`/files/${file.id}/preview`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to icon if preview fails
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'block';
                        }}
                    />
                ) : null}
                <IconComponent 
                    className={`${getIconSizeClasses()} ${getFileColor(file.mime_type)} absolute`}
                    style={{ display: 'none' }}
                />
            </div>
        );
    }

    return (
        <div className={`${getSizeClasses()} rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center ${className}`}>
            <IconComponent className={`${getIconSizeClasses()} ${getFileColor(file.mime_type)}`} />
        </div>
    );
}

