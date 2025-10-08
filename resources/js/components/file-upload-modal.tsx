import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Folder, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, usePage } from '@inertiajs/react';

interface StorageLocationOption {
    id: number;
    name: string;
}

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => void;
    currentFolderId?: number;
    currentFolderName?: string;
    storageLocations?: StorageLocationOption[];
}

import { useEffect } from 'react';

export default function FileUploadModal({ isOpen, onClose, onUpload, currentFolderId, currentFolderName, storageLocations = [] }: FileUploadModalProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const isStaff = user && user.role === 'staff';

    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    // Reset uploadedFiles only when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setUploadedFiles([]);
        }
    }, [isOpen]);

    const { data, setData, post, processing, errors, reset } = useForm({
        files: [] as File[],
        folder_id: currentFolderId || null,
        disk_id: storageLocations.length ? storageLocations[0].id : undefined as number | undefined,
        description: '',
        tags: '',
        visibility: 'public', // Default to public for staff, private for others
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setUploadedFiles((prev) => {
            // Avoid duplicates by name and size
            const newFiles = acceptedFiles.filter(
                (file) => !prev.some((f) => f.name === file.name && f.size === file.size)
            );
            const allFiles = [...prev, ...newFiles];
            setData('files', allFiles);
            return allFiles;
        });
    }, [setData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            // Images
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'],

            // Documents
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'text/plain': ['.txt', '.md'],
            'application/json': ['.json'],
            'application/xml': ['.xml'],
            'text/xml': ['.xml'],
            'text/html': ['.html', '.htm'],
            'text/css': ['.css'],
            'text/javascript': ['.js'],
            'application/javascript': ['.js'],

            // Archives
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip'],
            'application/x-compressed-zip': ['.zip'],
            'application/x-rar-compressed': ['.rar'],
            'application/vnd.rar': ['.rar'],
            'application/x-7z-compressed': ['.7z'],
            'application/gzip': ['.gz'],

            // Videos
            'video/mp4': ['.mp4'],
            'video/x-matroska': ['.mkv'],
            'video/webm': ['.webm'],
            'video/quicktime': ['.mov'],
            'video/avi': ['.avi'],
            'video/wmv': ['.wmv'],
            'video/flv': ['.flv'],

            // Audio
            'audio/mp3': ['.mp3'],
            'audio/mpeg': ['.mp3'],
            'audio/wav': ['.wav'],
            'audio/ogg': ['.ogg'],
            'audio/x-m4a': ['.m4a'],
            'audio/aac': ['.aac'],
        },
    });

    const handleUpload = () => {
        if (uploadedFiles.length === 0) return;

        post('/files', {
            forceFormData: true,
            onSuccess: () => {
                onUpload(uploadedFiles);
                reset();
                onClose();
            },
            onError: (errors) => {
                console.error('Upload error:', errors);
            },
        });
    };

    const removeFile = (index: number) => {
        const newFiles = uploadedFiles.filter((_, i) => i !== index);
        setUploadedFiles(newFiles);
        setData('files', newFiles);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Unggah File
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto flex-1">
                    {/* Folder Indicator */}
                    {currentFolderName && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-blue-800 dark:text-blue-200">
                                File akan diunggah ke: <strong>{currentFolderName}</strong>
                            </span>
                        </div>
                    )}

                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            isDragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-300 hover:border-slate-400 dark:border-slate-600'
                        }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        {isDragActive ? (
                            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                                Drop files here...
                            </p>
                        ) : (
                            <div>
                                <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                                    Seret & lepaskan file di sini, atau klik untuk memilih
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Supports: Images, PDF, Word, Excel, PowerPoint, Text, Archives
                                </p>
                            </div>
                        )}
                    </div>

                    {/* File List */}
                    {uploadedFiles.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                                File untuk diunggah ({uploadedFiles.length})
                            </h4>
                            <div className="max-h-32 overflow-y-auto space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <File className="h-5 w-5 text-slate-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                            className="text-slate-400 hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* File Options */}
                    {uploadedFiles.length > 0 && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                                Pengaturan File
                            </h4>

                            {/* Visibility */}
                            <div className="space-y-2">
                                <Label htmlFor="visibility">Visibilitas</Label>
                                <Select value={data.visibility} onValueChange={(value) => setData('visibility', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih visibilitas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {!isStaff && (
                                            <>
                                                <SelectItem value="private">Pribadi</SelectItem>
                                                <SelectItem value="shared">Dibagikan</SelectItem>
                                            </>
                                        )}
                                        <SelectItem value="public">Publik</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.visibility && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.visibility}
                                    </div>
                                )}
                            </div>

                            {/* Storage Location */}
                            <div className="space-y-2">
                                <Label htmlFor="disk_id">Lokasi Penyimpanan</Label>
                                <Select value={data.disk_id ? String(data.disk_id) : undefined} onValueChange={(v) => setData('disk_id', Number(v))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih lokasi penyimpanan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {storageLocations.map((loc) => (
                                            <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.disk_id && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        {String(errors.disk_id)}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Tambahkan deskripsi untuk file..."
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                                />
                                {errors.description && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.description}
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <Label htmlFor="tags">Tag (Opsional)</Label>
                                <Input
                                    id="tags"
                                    value={data.tags}
                                    onChange={(e) => setData('tags', e.target.value)}
                                    placeholder="Masukkan tag dipisahkan koma (contoh: dokumen, penting, proyek)"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Pisahkan tag dengan koma untuk memudahkan pencarian
                                </p>
                                {errors.tags && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.tags}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Upload Progress */}
                    {processing && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-300">Mengunggah...</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full animate-pulse" />
                            </div>
                        </div>
                    )}

                </div>

                {/* Actions - Fixed at bottom */}
                <div className="flex items-center justify-end gap-3 border-t pt-4 mt-4">
                    <Button variant="outline" onClick={onClose} disabled={processing}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={uploadedFiles.length === 0 || processing}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {processing ? 'Mengunggah...' : `Unggah ${uploadedFiles.length} file`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
