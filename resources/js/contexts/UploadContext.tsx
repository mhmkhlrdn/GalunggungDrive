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

    const uploadFiles = useCallback(async (files: File[], formData: FormData) => {
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

        for (const upload of newUploads) {
            const source = axios.CancelToken.source();
            upload.cancelSource = () => source.cancel('Upload cancelled by user.');

            setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'uploading', startTime: Date.now() } : u));

            try {
                await axios.post('/files', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const { loaded, total } = progressEvent;
                        if (total) {
                            const progress = Math.round((loaded * 100) / total);
                            const currentTime = Date.now();
                            const elapsedTime = (currentTime - (upload.startTime || currentTime)) / 1000; // in seconds
                            const bytesPerSecond = loaded / elapsedTime;
                            const remainingBytes = total - loaded;
                            const estimatedTime = bytesPerSecond > 0 ? remainingBytes / bytesPerSecond : undefined;

                            setUploads(prev => prev.map(u =>
                                u.id === upload.id
                                    ? { ...u, progress, uploadedBytes: loaded, totalBytes: total, estimatedTime }
                                    : u
                            ));
                        }
                    },
                    cancelToken: source.token,
                });

                setUploads(prev => prev.map(u =>
                    u.id === upload.id ? { ...u, progress: 100, uploadedBytes: u.totalBytes, status: 'completed', endTime: Date.now() } : u
                ));
            } catch (error) {
                if (axios.isCancel(error)) {
                    setUploads(prev => prev.map(u =>
                        u.id === upload.id ? { ...u, status: 'cancelled', endTime: Date.now(), error: error.message } : u
                    ));
                } else {
                    console.error('Upload failed:', error);
                    setUploads(prev => prev.map(u =>
                        u.id === upload.id ? { ...u, status: 'failed', endTime: Date.now(), error: 'Upload failed' } : u
                    ));
                }
            }
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
