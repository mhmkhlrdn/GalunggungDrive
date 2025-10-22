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

        // Send the full FormData in a single request so the server receives the
        // `files[0]`, `files[1]`, ... and `relative_paths[...]` keys exactly as built
        // by the upload modal. This avoids mismatches when the modal constructs
        // indexed form keys and the context was splitting requests per file.
        const source = axios.CancelToken.source();

        // Mark all uploads as uploading
        setUploads(prev => prev.map(u => newUploads.find(nu => nu.id === u.id) ? { ...u, status: 'uploading', startTime: Date.now() } : u));

        try {
            await axios.post('/files', commonFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const { loaded, total } = progressEvent;
                    if (!total) return;
                    const progress = Math.round((loaded * 100) / total);

                    // Update all new uploads with the overall progress percentage
                    setUploads(prev => prev.map(u => newUploads.some(nu => nu.id === u.id) ? { ...u, progress, uploadedBytes: Math.round((progress / 100) * u.totalBytes) } : u));
                },
                cancelToken: source.token,
            });

            // Mark all as completed
            setUploads(prev => prev.map(u => newUploads.some(nu => nu.id === u.id) ? { ...u, progress: 100, uploadedBytes: u.totalBytes, status: 'completed', endTime: Date.now() } : u));
        } catch (error) {
            if (axios.isCancel(error)) {
                setUploads(prev => prev.map(u => newUploads.some(nu => nu.id === u.id) ? { ...u, status: 'cancelled', endTime: Date.now(), error: (error as any).message } : u));
            } else {
                console.error('Upload failed:', error);
                setUploads(prev => prev.map(u => newUploads.some(nu => nu.id === u.id) ? { ...u, status: 'failed', endTime: Date.now(), error: 'Upload failed' } : u));
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
