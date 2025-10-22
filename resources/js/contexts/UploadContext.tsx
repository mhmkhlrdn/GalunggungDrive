import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface UploadFile {
    id: string;
    name: string;
    size: number;
    progress: number; // 0-100
    uploadedBytes: number;
    totalBytes: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
    estimatedTime?: number; // in seconds
    startTime?: number; // timestamp
    endTime?: number; // timestamp
    error?: string;
    cancelSource?: () => void;
}

interface UploadContextType {
    uploads: UploadFile[];
    uploadFiles: (files: File[], data: FormData) => void;
    cancelUpload: (id: string) => void;
    clearCompletedUploads: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
    const [uploads, setUploads] = useState<UploadFile[]>([]);

    const uploadFiles = useCallback(async (files: File[], commonFormData: FormData) => {
        if (!files || files.length === 0) return;

        // Prepare upload entries for each file for UI tracking
        const newUploads: UploadFile[] = files.map(file => ({
            id: uuidv4(),
            name: file.name,
            size: file.size,
            progress: 0,
            uploadedBytes: 0,
            totalBytes: file.size,
            status: 'pending',
        }));

        setUploads(prev => [...prev, ...newUploads]);

        // Helper: extract scalar fields (folder_id, disk_id, description, tags, visibility)
        const scalarFields: Record<string, string> = {};
        const relativePaths: string[] = [];
        for (const [key, value] of Array.from(commonFormData.entries())) {
            if (typeof key === 'string' && key.startsWith('relative_paths[')) {
                // parse index
                const match = key.match(/relative_paths\[(\d+)\]/);
                if (match) {
                    const idx = Number(match[1]);
                    relativePaths[idx] = String(value as string);
                }
            } else if (key !== 'files' && !key.startsWith('files[')) {
                scalarFields[key] = String(value as string);
            }
        }

        // Upload the first file with high priority
        const uploadSingle = async (fileIndex: number) => {
            const file = files[fileIndex];
            const uploadEntry = newUploads[fileIndex];

            const fd = new FormData();
            fd.append('files[0]', file);
            fd.append('relative_paths[0]', relativePaths[fileIndex] ?? file.name);
            // append scalar fields
            Object.keys(scalarFields).forEach(k => fd.append(k, scalarFields[k]));

            const source = axios.CancelToken.source();

            // mark this upload as uploading and attach cancel
            setUploads(prev => prev.map(u => u.id === uploadEntry.id ? { ...u, status: 'uploading', startTime: Date.now(), cancelSource: () => source.cancel('cancelled') } : u));

            try {
                await axios.post('/files', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (e) => {
                        const { loaded, total } = e;
                        if (!total) return;
                        const progress = Math.round((loaded * 100) / total);
                        setUploads(prev => prev.map(u => u.id === uploadEntry.id ? { ...u, progress, uploadedBytes: Math.round((progress / 100) * u.totalBytes) } : u));
                    },
                    cancelToken: source.token,
                });

                setUploads(prev => prev.map(u => u.id === uploadEntry.id ? { ...u, progress: 100, uploadedBytes: u.totalBytes, status: 'completed', endTime: Date.now() } : u));
            } catch (error) {
                if (axios.isCancel(error)) {
                    const err = error as unknown;
                    const msg = (err && typeof err === 'object' && 'message' in (err as Record<string, unknown>) && typeof (err as Record<string, unknown>).message === 'string')
                        ? String((err as Record<string, unknown>).message)
                        : 'Cancelled';
                    setUploads(prev => prev.map(u => u.id === uploadEntry.id ? { ...u, status: 'cancelled', endTime: Date.now(), error: msg } : u));
                } else {
                    console.error('Upload failed for file', uploadEntry.name, error);
                    setUploads(prev => prev.map(u => u.id === uploadEntry.id ? { ...u, status: 'failed', endTime: Date.now(), error: 'Upload failed' } : u));
                }
            }
        };

        // First file
        await uploadSingle(0);

        // Upload remaining files sequentially (one at a time) to avoid uploading all at once
        // Upload remaining files sequentially (one-by-one) so the first file has priority
        // Continue on errors so one failure doesn't halt the queue
        for (let i = 1; i < files.length; i++) {
            // await sequentially
            await uploadSingle(i);
        }
    }, []);

    const cancelUpload = useCallback((id: string) => {
        setUploads(prev => prev.map(upload => {
            if (upload.id === id && upload.status === 'uploading' && upload.cancelSource) {
                upload.cancelSource();
                return { ...upload, status: 'cancelled', endTime: Date.now(), error: 'Cancelled by user' };
            }
            return upload;
        }));
    }, []);

    const clearCompletedUploads = useCallback(() => {
        setUploads(prev => prev.filter(upload => upload.status !== 'completed' && upload.status !== 'failed' && upload.status !== 'cancelled'));
    }, []);

    return (
        <UploadContext.Provider value={{ uploads, uploadFiles, cancelUpload, clearCompletedUploads }}>
            {children}
        </UploadContext.Provider>
    );
};

export const useUpload = () => {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error('useUpload must be used within an UploadProvider');
    }
    return context;
};
