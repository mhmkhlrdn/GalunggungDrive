import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import FileUploadModal from '@/components/file-upload-modal';
import CreateFolderModal from '@/components/create-folder-modal';
import MoveFileModal from '@/components/move-file-modal';
import FileEditModal from '@/components/file-edit-modal';
import ShareModal from '@/components/share-modal';
import FilePreview from '@/components/file-preview';
import { 
    Upload, 
    FolderPlus, 
    Search, 
    Filter, 
    Grid3X3, 
    List, 
    MoreHorizontal,
    Star,
    Download,
    Share2,
    Trash2,
    Eye,
    Edit,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    File,
    Move
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface File {
    id: number;
    name: string;
    size: string;
    mime_type: string;
    created_at: string;
    updated_at: string;
    description?: string;
    tags?: string[];
    visibility: 'private' | 'shared' | 'public';
    folder?: {
        id: number;
        name: string;
    };
}

interface Folder {
    id: number;
    name: string;
    parent_id?: number;
}

interface Props {
    files: {
        data: File[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    currentFolder?: {
        id: number;
        name: string;
    };
    breadcrumbs: BreadcrumbItem[];
    filters: {
        search: string;
        sort_by: string;
        sort_order: string;
    };
    folders: Folder[];
    users?: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    disks?: Array<{ key: string; label: string }>;
}

export default function FilesIndex({ files, currentFolder, breadcrumbs, filters, folders, users = [], disks = [] }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [fileToMove, setFileToMove] = useState<{id: number, name: string} | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<File | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareSelection, setShareSelection] = useState<File[]>([]);
    const [search, setSearch] = useState(filters.search || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order as any || 'desc');

    // Handle URL action parameter
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'upload') {
            setShowUploadModal(true);
            // Clean up the URL by removing the action parameter
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('action');
            window.history.replaceState({}, '', newUrl.toString());
        }
    }, []);

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

    const toggleFileSelection = (fileId: number) => {
        setSelectedFiles(prev => 
            prev.includes(fileId) 
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const selectAllFiles = () => {
        setSelectedFiles(files.data.map(file => file.id));
    };

    const clearSelection = () => {
        setSelectedFiles([]);
    };

    const toggleSelectAll = () => {
        if (selectedFiles.length === files.data.length) {
            clearSelection();
        } else {
            selectAllFiles();
        }
    };

    // Debounced search & filter routing
    const searchDebounceRef = useRef<number | null>(null);
    useEffect(() => {
        // Don't trigger search if there's an action parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('action')) {
            return;
        }
        
        if (searchDebounceRef.current) {
            window.clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = window.setTimeout(() => {
            router.get('/files', { search, sort_by: sortBy, sort_order: sortOrder }, { preserveState: true, replace: true });
        }, 350);
        return () => {
            if (searchDebounceRef.current) {
                window.clearTimeout(searchDebounceRef.current);
            }
        };
    }, [search, sortBy, sortOrder]);

    const goToPage = (page: number) => {
        router.get('/files', { search, sort_by: sortBy, sort_order: sortOrder, page }, { preserveState: true, replace: true });
    };

    const handleFileUpload = (uploadedFiles: globalThis.File[]) => {
        router.reload();
    };

    const handleFolderCreate = (name: string) => {
        router.reload();
    };

    // Per-file actions open modals or perform direct navigation as appropriate
    const handleShareFile = (file: File) => {
        setShareSelection([file]);
        setShowShareModal(true);
    };

    const handleDeleteFile = (fileId: number) => {
        if (confirm('Are you sure you want to delete this file?')) {
            router.delete(`/files/${fileId}`);
        }
    };

    const handleViewFile = (fileId: number) => {
        window.open(`/files/${fileId}/preview`, '_blank');
    };

    const handleShare = async (fileIds: number[], userIds: number[], permission: string, expiresAt?: string, isPublicLink?: boolean) => {
        try {
            // Prepare batch update data
            const updates = fileIds.map(fileId => {
                const file = files.data.find(f => f.id === fileId);
                if (!file) return null;

                return {
                    file_id: fileId,
                    name: file.name,
                    description: file.description || '',
                    tags: file.tags ? file.tags.join(', ') : '',
                    visibility: isPublicLink ? 'public' : (userIds.length > 0 ? 'shared' : 'private'),
                    shared_with: userIds
                };
            }).filter(Boolean);

            // Send batch update request
            const response = await fetch('/api/files/batch-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ updates }),
            });

            if (response.ok) {
                // Reload the page to show updated shares
                window.location.reload();
            } else {
                console.error('Error updating files:', await response.text());
            }
        } catch (error) {
            console.error('Error updating files:', error);
        }
    };

    // Bulk actions
    const handleBulkDownload = () => {
        files.data.forEach(f => {
            if (selectedFiles.includes(f.id)) {
                window.open(`/files/${f.id}/download`, '_blank');
            }
        });
    };

    const handleBulkShare = () => {
        const filesToShare = files.data.filter(f => selectedFiles.includes(f.id));
        if (filesToShare.length === 0) return;
        setShareSelection(filesToShare);
        setShowShareModal(true);
    };

    const handleBulkDelete = () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Hapus ${selectedFiles.length} file terpilih?`)) return;
        selectedFiles.forEach(id => router.delete(`/files/${id}`));
        router.reload();
    };

    const handleMoveFile = (fileId: number, fileName: string) => {
        setFileToMove({ id: fileId, name: fileName });
        setShowMoveModal(true);
    };

    const handleFileMove = (folderId: number | null) => {
        router.reload();
    };

    const handleEditFile = (file: File) => {
        setFileToEdit(file);
        setShowEditModal(true);
    };

    const handleToggleStar = (fileId: number) => {
        router.post(`/files/${fileId}/toggle-star`, {}, {
            onSuccess: () => {
                // Force a complete page reload to ensure the star status is updated
                window.location.reload();
            },
            onError: (errors) => {
                console.error('Star toggle error:', errors);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="File Saya" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {currentFolder ? currentFolder.name : 'File Saya'}
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {files.total} file • {currentFolder ? 'dalam folder ini' : 'total'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {currentFolder ? `Upload to ${currentFolder.name}` : 'Upload File'}
                        </button>
                        <button 
                            onClick={() => setShowCreateFolderModal(true)}
                            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Folder Baru
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari file..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={selectedFiles.length === files.data.length && files.data.length > 0}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Pilih semua</span>
                        </label>
                        {selectedFiles.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    {selectedFiles.length} dipilih
                                </span>
                                <button
                                    onClick={clearSelection}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Hapus
                                </button>
                            </div>
                        )}
                        <button className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </button>
                        <div className="flex rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedFiles.length > 0 && (
                    <div className="sticky top-0 z-20 rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedFiles.length} file dipilih
                            </span>
                            <div className="flex items-center space-x-2">
                                <button onClick={handleBulkDownload} aria-label="Download terpilih" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                                    <Download className="mr-1 h-3 w-3" />
                                    Download
                                </button>
                                <button onClick={handleBulkShare} aria-label="Bagikan terpilih" className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                                    <Share2 className="mr-1 h-3 w-3" />
                                    Bagikan
                                </button>
                                <button onClick={handleBulkDelete} aria-label="Hapus terpilih" className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Files Grid/List */}
                {files.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                            <FileText className="h-12 w-12 text-slate-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">Tidak ada file ditemukan</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {filters.search ? 'Coba sesuaikan kata kunci pencarian Anda.' : 
                             currentFolder ? `Upload file ke folder "${currentFolder.name}" untuk memulai.` : 
                             'Upload file pertama Anda untuk memulai.'}
                        </p>
                        {!filters.search && (
                            <button 
                                onClick={() => setShowUploadModal(true)}
                                className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-blue-700 hover:to-indigo-700"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {currentFolder ? `Upload to ${currentFolder.name}` : 'Upload File'}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                        : 'space-y-2'
                    }>
                        {files.data.map((file) => {
                            const isSelected = selectedFiles.includes(file.id);
                            
                            return (
                                <div
                                    key={file.id}
                                    className={`group relative rounded-lg border-2 p-4 transition-all hover:shadow-lg dark:border-slate-700 ${
                                        isSelected 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                            : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-800 dark:hover:border-slate-600'
                                    } ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}
                                >
                                    {/* Checkbox - always accessible */}
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleFileSelection(file.id)}
                                        className="absolute top-2 left-2 z-20 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    
                                    {/* Star button - always accessible */}
                                    <button 
                                        onClick={() => handleToggleStar(file.id)}
                                        className={`absolute top-2 right-2 z-20 p-1 rounded-full transition-colors ${
                                            file.starred 
                                                ? 'text-yellow-500 hover:text-yellow-600' 
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                        aria-label={file.starred ? "Hapus dari favorit" : "Tambah ke favorit"}
                                        title={file.starred ? "Hapus dari favorit" : "Tambah ke favorit"}
                                    >
                                        <Star className={`h-4 w-4 ${file.starred ? 'fill-current' : ''}`} />
                                    </button>

                                    <div className="flex items-start space-x-3">
                                        <div className={`flex-shrink-0 ${viewMode === 'list' ? 'mt-0' : 'mt-1'}`}>
                                            <FilePreview 
                                                file={file} 
                                                size={viewMode === 'grid' ? 'lg' : 'md'}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {file.name}
                                                </h3>
                                                <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {file.size} • {new Date(file.updated_at).toLocaleDateString()}
                                            </p>
                                            {file.description && (
                                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                                                    {file.description}
                                                </p>
                                            )}
                                            {file.tags && file.tags.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {file.tags.slice(0, 3).map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {file.tags.length > 3 && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            +{file.tags.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Quick Actions toolbar (bottom-right), does not cover star button */}
                                    <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="pointer-events-auto flex items-center space-x-2">
                                            <button 
                                                onClick={() => handleViewFile(file.id)}
                                                className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                                                aria-label="Lihat file"
                                                title="View file"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
                                                className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                                                aria-label="Unduh file"
                                                title="Download file"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleMoveFile(file.id, file.name)}
                                                className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                                                aria-label="Pindahkan file"
                                                title="Move file"
                                            >
                                                <Move className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleEditFile(file)}
                                                className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                                                aria-label="Edit file"
                                                title="Edit file"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleShareFile(file)}
                                                className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                                                aria-label="Bagikan file"
                                                title="Share file"
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteFile(file.id)}
                                                className="rounded-full bg-white p-2 text-red-600 shadow-sm hover:bg-red-50"
                                                aria-label="Hapus file"
                                                title="Delete file"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {files.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Menampilkan {((files.current_page - 1) * files.per_page) + 1} sampai {Math.min(files.current_page * files.per_page, files.total)} dari {files.total} hasil
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => goToPage(files.current_page - 1)}
                                disabled={files.current_page === 1}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => goToPage(files.current_page + 1)}
                                disabled={files.current_page === files.last_page}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}

                {/* Modals */}
                <FileUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUpload={handleFileUpload}
                    currentFolderId={currentFolder?.id}
                    currentFolderName={currentFolder?.name}
                    disks={disks}
                />
                <CreateFolderModal
                    isOpen={showCreateFolderModal}
                    onClose={() => setShowCreateFolderModal(false)}
                    onCreate={handleFolderCreate}
                    parentId={currentFolder?.id}
                />
                {fileToMove && (
                    <MoveFileModal
                        isOpen={showMoveModal}
                        onClose={() => {
                            setShowMoveModal(false);
                            setFileToMove(null);
                        }}
                        onMove={handleFileMove}
                        fileId={fileToMove.id}
                        fileName={fileToMove.name}
                        currentFolderId={currentFolder?.id}
                        folders={folders}
                    />
                )}
                {fileToEdit && (
                    <FileEditModal
                        isOpen={showEditModal}
                        onClose={() => {
                            setShowEditModal(false);
                            setFileToEdit(null);
                        }}
                        file={fileToEdit}
                        users={users}
                    />
                )}
                {shareSelection.length > 0 && (
                    <ShareModal
                        isOpen={showShareModal}
                        onClose={() => {
                            setShowShareModal(false);
                            setShareSelection([]);
                        }}
                        onShare={handleShare}
                        files={files.data}
                        selectedFiles={shareSelection}
                        users={users}
                        mode="user-selection"
                    />
                )}
            </div>
        </AppLayout>
    );
}
