import React, { useState } from 'react';
import { useUpload, UploadFile } from '@/contexts/UploadContext';
import { X, CheckCircle, AlertCircle, Loader, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // Assuming you have a Progress component

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTimeRemaining = (seconds?: number) => {
    if (seconds === undefined || seconds === Infinity || seconds < 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s remaining`;
    }
    return `${remainingSeconds}s remaining`;
};

export default function UploadProgressIndicator() {
    const { uploads, cancelUpload, clearCompletedUploads } = useUpload();
    const [collapsed, setCollapsed] = useState(false);
    const activeUploads = uploads.filter(upload => upload.status === 'uploading' || upload.status === 'pending');
    const completedUploads = uploads.filter(upload => upload.status === 'completed' || upload.status === 'failed' || upload.status === 'cancelled');

    if (uploads.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80">
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-t-lg shadow-lg">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
                Upload {uploads.length}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <ChevronUp /> : <ChevronDown />}
            </Button>
        </div>
{ !collapsed && (

             <div className="max-h-[70vh] overflow-y-auto space-y-3 p-2 bg-white dark:bg-slate-800 rounded-b-lg shadow-lg">

            {activeUploads.map((upload) => (
                <div key={upload.id} className="rounded-lg bg-white p-4 shadow-lg dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Loader className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {upload.name}
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => cancelUpload(upload.id)}>
                            <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                        </Button>
                    </div>
                    <div className="mt-2">
                        <Progress value={upload.progress} className="h-2" />
                        <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatFileSize(upload.uploadedBytes)} / {formatFileSize(upload.totalBytes)}</span>
                            {upload.status === 'uploading' && upload.estimatedTime !== undefined && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimeRemaining(upload.estimatedTime)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {completedUploads.length > 0 && (
                <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                            Upload Selesai ({completedUploads.length})
                        </h4>
                        <Button variant="ghost" size="sm" onClick={clearCompletedUploads}>
                            <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                        </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {completedUploads.map((upload) => (
                            <div key={upload.id} className="flex items-center gap-2 text-sm">
                                {upload.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {upload.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                {upload.status === 'cancelled' && <X className="h-4 w-4 text-slate-500" />}
                                <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
                                    {upload.name}
                                </span>
                                {upload.status === 'failed' && (
                                    <span className="text-xs text-red-500">Failed</span>
                                )}
                                {upload.status === 'cancelled' && (
                                    <span className="text-xs text-slate-500">Cancelled</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
                 </div>
 )}

        </div>
    );
}
