import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, Video, Music, Archive, File } from 'lucide-react';

interface FileUploadProps {
    onUpload: (files: File[]) => void;
    maxFiles?: number;
    maxSize?: number; // in bytes
    acceptedTypes?: string[];
    className?: string;
}

export default function FileUpload({ 
    onUpload, 
    maxFiles = 10, 
    maxSize = 100 * 1024 * 1024, // 100MB
    acceptedTypes = ['*/*'],
    className = ''
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setUploadedFiles(prev => [...prev, ...acceptedFiles]);
        onUpload(acceptedFiles);
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        maxFiles,
        maxSize,
        accept: acceptedTypes.reduce((acc, type) => {
            acc[type] = [];
            return acc;
        }, {} as Record<string, string[]>),
        onDropRejected: (fileRejections) => {
            console.log('Rejected files:', fileRejections);
        }
    });

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return Image;
        if (file.type.startsWith('video/')) return Video;
        if (file.type.startsWith('audio/')) return Music;
        if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) return Archive;
        if (file.type === 'application/pdf') return FileText;
        return File;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-700'
                }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/20">
                        <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-slate-900 dark:text-white">
                            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            or click to select files
                        </p>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Max {maxFiles} files, up to {formatFileSize(maxSize)} each
                    </div>
                </div>
            </div>

            {/* File Rejections */}
            {fileRejections.length > 0 && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        Some files were rejected:
                    </h4>
                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                        {fileRejections.map((rejection, index) => (
                            <li key={index}>
                                {rejection.file.name}: {rejection.errors.map(e => e.message).join(', ')}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                        Selected Files ({uploadedFiles.length})
                    </h4>
                    <div className="space-y-2">
                        {uploadedFiles.map((file, index) => {
                            const IconComponent = getFileIcon(file);
                            
                            return (
                                <div
                                    key={index}
                                    className="flex items-center space-x-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <IconComponent className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Upload Button */}
            {uploadedFiles.length > 0 && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => {
                            setUploading(true);
                            // Simulate upload process
                            setTimeout(() => {
                                setUploading(false);
                                setUploadedFiles([]);
                            }, 2000);
                        }}
                        disabled={uploading}
                        className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload {uploadedFiles.length} file(s)
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}


