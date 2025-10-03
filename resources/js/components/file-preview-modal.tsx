import { useState, useEffect } from 'react';
// If you use a toast system, import it here. Example:
// import { toast } from '@/components/ui/use-toast';
import { formatFileSize } from '@/lib/utils';
import { X, Download, Share2, Eye, FileText, Image, Video, Music, Archive, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ShareModal from '@/components/share-modal';
import { User } from '@/types';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    loggedinUser: User;
    file: {
        id: number;
        name: string;
        mime_type: string;
        size: string;
        created_at: string;
        description?: string;
        tags?: string[];
        uploader?: {
            id: number;
            name: string;
            email: string;
        };
    } | null;
}

export default function FilePreviewModal({ isOpen, onClose, file, loggedinUser, users = [] }: FilePreviewModalProps & { users?: Array<{ id: number; name: string; email: string }> }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (file && isOpen) {
            setLoading(true);
            setError(null);
            setPreviewUrl(null);

            if (isImage(file.mime_type) || isVideo(file.mime_type) || isAudio(file.mime_type) || isPdf(file.mime_type) || isText(file.mime_type)) {
                const url = `/files/${file.id}/preview`;
                setPreviewUrl(url);

                timeout = setTimeout(() => {
                    setError('Preview loading timeout');
                    setLoading(false);
                }, 10000);

                fetch(url, { method: 'HEAD' })
                    .then(response => {
                        clearTimeout(timeout);
                        if (response.ok) {
                            setLoading(false);
                        } else {
                            setError('Gagal menampilkan file.');
                            setLoading(false);
                        }
                    })
                    .catch(() => {
                        clearTimeout(timeout);
                        setError('Gagal menampilkan file.');
                        setLoading(false);
                    });
            } else {
                setError('File ini tidak dapat diperlihatkan.');
                setLoading(false);
            }
        } else {
            setPreviewUrl(null);
            setLoading(false);
            setError(null);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [file, isOpen]);

    const isImage = (mimeType: string) => mimeType.startsWith('image/');
    const isVideo = (mimeType: string) => mimeType.startsWith('video/');
    const isAudio = (mimeType: string) => mimeType.startsWith('audio/');
    const isPdf = (mimeType: string) => mimeType === 'application/pdf';
    const isText = (mimeType: string) => mimeType.startsWith('text/');

    const getFileIcon = (mimeType: string) => {
        if (isImage(mimeType)) return Image;
        if (isVideo(mimeType)) return Video;
        if (isAudio(mimeType)) return Music;
        if (mimeType === 'application/pdf') return FileText;
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return Archive;
        return File;
    };

    const getFileColor = (mimeType: string) => {
        if (isImage(mimeType)) return 'text-green-600';
        if (isVideo(mimeType)) return 'text-purple-600';
        if (isAudio(mimeType)) return 'text-pink-600';
        if (mimeType === 'application/pdf') return 'text-red-600';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'text-orange-600';
        return 'text-slate-600';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!file) return null;

    const IconComponent = getFileIcon(file.mime_type);
    const fileColor = getFileColor(file.mime_type);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconComponent className={`h-5 w-5 ${fileColor}`} />
                        {file.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <FileText className="h-16 w-16 text-slate-400 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                                Preview not available
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                {error}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download File
                                </Button>
                            </div>
                        </div>
                    )}

                    {previewUrl && !loading && !error && (
                        <div className="space-y-4">
                            {/* File Preview */}
                            <div className="border rounded-lg overflow-hidden">
                                {isImage(file.mime_type) && (
                                    <img
                                        src={previewUrl}
                                        alt={file.name}
                                        className="w-full h-auto max-h-96 object-contain"
                                        onLoad={() => setLoading(false)}
                                        onError={() => {
                                            setError('Failed to load image preview');
                                            setLoading(false);
                                        }}
                                    />
                                )}
                                {isVideo(file.mime_type) && (
                                    <video
                                        src={previewUrl}
                                        controls
                                        className="w-full h-auto max-h-96"
                                        onLoadedData={() => setLoading(false)}
                                        onError={() => {
                                            setError('Failed to load video preview');
                                            setLoading(false);
                                        }}
                                        preload="metadata"
                                    />
                                )}
                                {isAudio(file.mime_type) && (
                                    <div className="p-8 text-center">
                                        <Music className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                                        <audio
                                            src={previewUrl}
                                            controls
                                            className="w-full"
                                            onLoadedData={() => setLoading(false)}
                                            onError={() => {
                                                setError('Failed to load audio preview');
                                                setLoading(false);
                                            }}
                                            preload="metadata"
                                        />
                                    </div>
                                )}
                                {isPdf(file.mime_type) && (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-96 border-0"
                                        onLoad={() => setLoading(false)}
                                        onError={() => {
                                            setError('Failed to load PDF preview');
                                            setLoading(false);
                                        }}
                                        title={`PDF Preview: ${file.name}`}
                                    />
                                )}
                                {isText(file.mime_type) && (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-96 border-0 bg-white text-left font-mono text-xs p-4"
                                        onLoad={() => setLoading(false)}
                                        onError={() => {
                                            setError('Failed to load text preview');
                                            setLoading(false);
                                        }}
                                        title={`Text Preview: ${file.name}`}
                                    />
                                )}
                            </div>

                            {/* File Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Informasi File</h4>
                                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                        <p><strong>Nama:</strong> {file.name}</p>
                                        <p><strong>Ukuran:</strong> {formatFileSize(file.size)}</p>
                                        <p><strong>Jenis File:</strong> {file.mime_type}</p>
                                        <p><strong>Dibuat pada:</strong> {new Date(file.created_at).toLocaleDateString()}</p>
                                        {file.uploader && (
                                            <p><strong>Diunggah oleh:</strong> {file.uploader.name}</p>
                                        )}
                                    </div>
                                </div>

                                {file.description && (
                                    <div>
                                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Description</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{file.description}</p>
                                    </div>
                                )}

                                {file.tags && file.tags.length > 0 && (
                                    <div className="md:col-span-2">
                                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {file.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>

                        {loggedinUser.id == file.uploader?.id &&
                        <Button variant="outline" onClick={() => setShowShareModal(true)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Bagikan
                        </Button>
                        }
                    </div>
                    <Button variant="outline" onClick={onClose}>
                        <X className="mr-2 h-4 w-4" />
                        Tutup
                    </Button>
                </div>

                {/* Show ShareModal */}
                {showShareModal && file && (
                    <ShareModal
                        isOpen={showShareModal}
                        onClose={() => setShowShareModal(false)}
                        onShare={() => setShowShareModal(false)}
                        files={[file]}
                        users={users}
                        mode="user-selection"
                        selectedFiles={[file]}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

