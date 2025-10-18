import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface VideoPreviewProps extends PageProps {
    file: {
        id: number;
        name: string;
        mime_type: string;
        size: number;
    };
}

export default function VideoPreview({ file }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [file.id]);

    const handleVideoError = () => {
        setError('Failed to load video. The file might be corrupted or not a supported video format.');
    };

    return (
        <>
            <Head title={`Preview: ${file.name}`} />
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                            {file.name}
                        </h2>
                    </div>

                    {error ? (
                        <div className="flex flex-col items-center justify-center h-96 text-center text-red-500">
                            <p className="text-lg">{error}</p>
                        </div>
                    ) : (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <video
    ref={videoRef}
    controls
    autoPlay
    muted
    playsInline
    preload="auto"
    className="absolute top-0 left-0 w-full h-full rounded-lg"
    src={`/files/${file.id}/preview`}
    onError={handleVideoError}
>
    Your browser does not support the video tag.
</video>

                        </div>
                    )}

                    <div className="mt-6 text-slate-700 dark:text-slate-300">
                        <p><strong>File Type:</strong> {file.mime_type}</p>
                        <p><strong>File Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                </div>
            </div>
        </>
    );
}
