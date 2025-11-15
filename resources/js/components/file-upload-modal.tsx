import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Folder, AlertCircle, ChevronRight, ChevronDown, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { useUpload } from '@/contexts/UploadContext';


interface StorageLocationOption {
    id: number;
    name: string;
}

interface Folder {
    id: number;
    name: string;
    parent_id?: number;
}

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => void;
    currentFolderId?: number;
    currentFolderName?: string;
    storageLocations?: StorageLocationOption[];
    folders?: Folder[];
}

interface UploadEntry {
    file: File;
    relativePath: string;
}

import { useEffect } from 'react';

export default function FileUploadModal({ isOpen, onClose, onUpload, currentFolderId, storageLocations = [], folders = [] }: FileUploadModalProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const isStaff = user && user.role === 'staff';
    const { uploadFiles } = useUpload();

    const [uploadedFiles, setUploadedFiles] = useState<UploadEntry[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(currentFolderId || null);
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
    const [showFolderSelector, setShowFolderSelector] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (!isOpen) {
            setUploadedFiles([]);
        }
    }, [isOpen]);

    const { data, setData, errors, reset } = useForm({
        files: [] as UploadEntry[],
        folder_id: selectedFolderId,
        disk_id: storageLocations.length ? storageLocations[0].id : undefined as number | undefined,
        description: '',
        tags: '',
        visibility: 'public',
    });

    // Update form data when selectedFolderId changes
    useEffect(() => {
        setData('folder_id', selectedFolderId);
    }, [selectedFolderId, setData]);


    const onDrop = useCallback((acceptedFiles: File[]) => {
        setUploadedFiles((prev) => {
            const newEntries = acceptedFiles.map(file => ({ file, relativePath: file.name }));

            const allFiles = [...prev, ...newEntries.filter(entry => !prev.some(f => f.file.name === entry.file.name && f.file.size === entry.file.size))];
            setData('files', allFiles);
            return allFiles;
        });
    }, [setData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        noClick: true,
        accept: {

            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'],


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


            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip'],
            'application/x-compressed-zip': ['.zip'],
            'application/x-rar-compressed': ['.rar'],
            'application/vnd.rar': ['.rar'],
            'application/x-7z-compressed': ['.7z'],
            'application/gzip': ['.gz'],


            'video/mp4': ['.mp4'],
            'video/x-matroska': ['.mkv'],
            'video/webm': ['.webm'],
            'video/quicktime': ['.mov'],
            'video/avi': ['.avi'],
            'video/wmv': ['.wmv'],
            'video/flv': ['.flv'],


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

        const formData = new FormData();
        const filesToUpload: File[] = [];
        uploadedFiles.forEach((entry, index) => {
            formData.append(`files[${index}]`, entry.file);
            formData.append(`relative_paths[${index}]`, entry.relativePath);
            filesToUpload.push(entry.file);
        });
        formData.append('folder_id', selectedFolderId ? String(selectedFolderId) : '');
        formData.append('disk_id', data.disk_id ? String(data.disk_id) : '');
        formData.append('description', data.description);
        formData.append('tags', data.tags);
        formData.append('visibility', data.visibility);

        // Start uploads in background and close modal immediately
        try {
            uploadFiles(filesToUpload, formData);
        } catch (e) {
            // uploadFiles is async; errors will be handled in UploadContext
            console.error('Failed to start upload', e);
        }

        // Fire onUpload and close/reset immediately per request
        onUpload(filesToUpload);
        reset();
        onClose();
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

    const buildFolderTree = (folders: Folder[], parentId: number | null = null): Folder[] => {
        return folders.filter(folder => folder.parent_id === parentId);
    };

    const toggleFolder = (folderId: number) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const selectFolder = (folderId: number | null) => {
        setSelectedFolderId(folderId);
        setShowFolderSelector(false);
    };

    const renderFolderTree = (foldersToRender: Folder[], level = 0): React.ReactElement[] => {
        return foldersToRender.map(folder => {
            const hasChildren = folders.some(f => f.parent_id === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const isSelected = selectedFolderId === folder.id;

            return (
                <div key={folder.id}>
                    <div
                        className={`flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                            isSelected ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600' : ''
                        }`}
                        style={{ paddingLeft: `${level * 20 + 8}px` }}
                        onClick={() => selectFolder(folder.id)}
                    >
                        {hasChildren ? (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFolder(folder.id);
                                }}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded flex-shrink-0"
                                type="button"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                )}
                            </button>
                        ) : (
                            <div className="w-5 h-5 flex-shrink-0" />
                        )}
                        <Folder className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-900 dark:text-white">{folder.name}</span>
                    </div>
                    {hasChildren && isExpanded && (
                        <div>
                            {renderFolderTree(buildFolderTree(folders, folder.id), level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const rootFolders = buildFolderTree(folders);
    const selectedFolderName = selectedFolderId
        ? folders.find(f => f.id === selectedFolderId)?.name || 'Root'
        : 'Root (No folder)';

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
                    {/* Folder Selection */}
                    {folders.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="folder">Pilih Folder Tujuan</Label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowFolderSelector(!showFolderSelector)}
                                    className="w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <Folder className="h-4 w-4" />
                                        {selectedFolderName}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showFolderSelector ? 'rotate-180' : ''}`} />
                                </Button>
                                {showFolderSelector && (
                                    <div className="absolute z-10 w-full mt-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 shadow-lg max-h-64 overflow-y-auto">
                                        <div
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${
                                                selectedFolderId === null ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600' : ''
                                            }`}
                                            onClick={() => selectFolder(null)}
                                        >
                                            <Home className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            <span className="text-sm text-slate-900 dark:text-white font-medium">Root (No folder)</span>
                                        </div>
                                        {rootFolders.length > 0 ? (
                                            renderFolderTree(rootFolders)
                                        ) : (
                                            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                                No folders available
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
                                <p className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                                    Seret & lepaskan file di sini, atau pilih file/folder
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2"
                                    >
                                        <File className="h-4 w-4" />
                                        Pilih File
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => folderInputRef.current?.click()}
                                        className="flex items-center gap-2"
                                    >
                                        <Folder className="h-4 w-4" />
                                        Pilih Folder
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                                    Supports: Images, PDF, Word, Excel, PowerPoint, Text, Archives
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Hidden inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={e => {
                            const files = Array.from(e.target.files || []);
                            setUploadedFiles(prev => {
                                const newEntries = files.map(f => ({
                                    file: f,
                                    relativePath: f.name
                                }));

                                const allFiles = [...prev, ...newEntries.filter(entry => !prev.some(f => f.file.name === entry.file.name && f.file.size === entry.file.size && f.relativePath === entry.relativePath))];
                                setData('files', allFiles);
                                return allFiles;
                            });
                        }}
                    />
                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
                        onChange={e => {
                            const files = Array.from(e.target.files || []);
                            setUploadedFiles(prev => {
                                const newEntries = files.map(f => ({
                                    file: f,
                                    relativePath: (typeof f === 'object' && 'webkitRelativePath' in f && f.webkitRelativePath) ? f.webkitRelativePath : f.name
                                }));

                                const allFiles = [...prev, ...newEntries.filter(entry => !prev.some(f => f.file.name === entry.file.name && f.file.size === entry.file.size && f.relativePath === entry.relativePath))];
                                setData('files', allFiles);
                                return allFiles;
                            });
                        }}
                    />

                    {/* File List */}
                    {uploadedFiles.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                                File untuk diunggah ({uploadedFiles.length})
                            </h4>
                            <div className="max-h-32 overflow-y-auto space-y-2">
                                {uploadedFiles.map((entry, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <File className="h-5 w-5 text-slate-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {entry.relativePath}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {formatFileSize(entry.file.size)}
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
                    {/* Removed as progress is now handled by UploadContext */}

                </div>

                {/* Actions - Fixed at bottom */}
                <div className="flex items-center justify-end gap-3 border-t pt-4 mt-4">
                    <Button variant="outline" onClick={onClose} >
                        Batal
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={uploadedFiles.length === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Unggah {uploadedFiles.length} file
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
