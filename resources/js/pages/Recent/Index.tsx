import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatFileSize, fuzzyFilter } from '@/lib/utils';
import FileUploadModal from '@/components/file-upload-modal';
import CreateFolderModal from '@/components/create-folder-modal';
import MoveFileModal from '@/components/move-file-modal';
import FileEditModal from '@/components/file-edit-modal';
import ShareModal from '@/components/share-modal';
import FilePreviewModal from '@/components/file-preview-modal';
import FilePreview from '@/components/file-preview';
import {
    Search,
    Grid3X3,
    List,
    MoreHorizontal,
    Star,
    Download,
    Share2,
    Trash2,
    Eye,
    Edit,
    Move,
    FolderOpen,
    Clock,
    Calendar,
    User,
    HardDrive
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useInertiaOperations } from '@/hooks/use-inertia-operations';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/messages';

interface FileItem {
    created_at: string;
    description?: string;
    tags?: string[];
    id: number;
    name: string;
    size: number; // Changed to number to match Files/Index.tsx
    mime_type: string;
    updated_at: string;
    starred: boolean;
    user: {
        id: number;
        name: string;
    };
    folder?: {
        id: number;
        name: string;
    };
    visibility: 'private' | 'shared' | 'public'; // Added visibility
}

interface Folder {
    id: number;
    name: string;
    parent_id?: number;
}

interface Props {
    files: {
        data: FileItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search: string;
        sort_by: string;
        sort_order: string;
    };
    folders: Folder[]; // Added folders
    users?: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    disks?: Array<{ id: number; name: string }>;
}

export default function RecentIndex({ files, filters, folders, users = [], disks = [] }: Props) {
    const { destroy, post } = useInertiaOperations();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [fileToMove, setFileToMove] = useState<{id: number, name: string} | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<FileItem | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareSelection, setShareSelection] = useState<FileItem[]>([]);
    const [search, setSearch] = useState(filters.search || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order as 'asc' | 'desc' || 'desc');
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [previewIndex, setPreviewIndex] = useState<number>(0);

    // Client-side fuzzy filtering
    const filteredFiles = fuzzyFilter(
        files.data,
        search,
        (file) => `${file.name} ${file.user.name} ${file.folder?.name || ''}`,
        0.2
    );

    // Apply sorting to filtered results
    const sortedFiles = [...filteredFiles].sort((a, b) => {
        let aValue: string | number | Date, bValue: string | number | Date;

        switch (sortBy) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'size':
                aValue = a.size;
                bValue = b.size;
                break;
            case 'created_at':
                aValue = new Date(a.updated_at);
                bValue = new Date(b.updated_at);
                break;
            default: // updated_at
                aValue = new Date(a.updated_at);
                bValue = new Date(b.updated_at);
        }

        if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    const toggleFileSelection = (fileId: number) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    // selectAllFiles removed (not used)

    const clearSelection = () => {
        setSelectedFiles([]);
    };


    const handleFileUpload = () => {
        router.reload();
    };

    const handleFolderCreate = () => {
        router.reload();
    };

    const handleShareFile = (file: FileItem) => {
        setShareSelection([file]);
        setShowShareModal(true);
    };

    const handleDeleteFile = (fileId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus file ini?')) {
            destroy(`/files/${fileId}`, {
                successMessage: SUCCESS_MESSAGES.FILE_DELETED,
                errorMessage: ERROR_MESSAGES.FILE_DELETE_FAILED,
                onSuccess: () => {
                    router.reload();
                }
            });
        }
    };

    const handleShare = (
        fileIds: number[],
        userIds: number[],
        permission: string,
        expiresAt?: string,
        isPublicLink?: boolean
    ) => {
        fileIds.forEach((fileId) => {
            if (isPublicLink) {
                post(`/files/${fileId}/share`, {
                    is_public_link: true,
                    permission,
                    expires_at: expiresAt
                }, {
                    successMessage: SUCCESS_MESSAGES.FILE_SHARED,
                    errorMessage: ERROR_MESSAGES.FILE_SHARE_FAILED
                });
            } else {
                userIds.forEach((userId) => {
                    post(`/files/${fileId}/share`, {
                        shared_with: userId,
                        permission,
                        expires_at: expiresAt
                    }, {
                        successMessage: SUCCESS_MESSAGES.FILE_SHARED,
                        errorMessage: ERROR_MESSAGES.FILE_SHARE_FAILED
                    });
                });
            }
        });
        router.reload();
    };

    type ModalFile = Omit<FileItem, 'size'> & { size: string };
    const filesForModal: ModalFile[] = useMemo(() => files.data.map<ModalFile>(f => ({ ...f, size: String(f.size) })), [files.data]);
    const shareSelectionForModal: ModalFile[] = useMemo(() => shareSelection.map<ModalFile>(f => ({ ...f, size: String(f.size) })), [shareSelection]);

    const handleBulkDownload = () => {
        files.data.forEach(f => {
            if (selectedFiles.includes(f.id)) {
                window.open(`/files/${f.id}/download`, '_blank');
            }
        });
    };

    // bulk share is not used in this page; open share modal for selection via actions

    const handleBulkDelete = () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Hapus ${selectedFiles.length} file terpilih?`)) return;

        // Use single API call to delete multiple files to avoid Inertia cancelling
        // concurrent router.delete calls. The API will authorize/delete each file.
        post('/api/files/batch-delete', { ids: selectedFiles }, {
            successMessage: `${selectedFiles.length} file berhasil dihapus.`,
            errorMessage: ERROR_MESSAGES.FILE_DELETE_FAILED,
            onSuccess: () => router.reload()
        });
    };

    const handleMoveFile = (fileId: number, fileName: string) => {
        setFileToMove({ id: fileId, name: fileName });
        setShowMoveModal(true);
    };

    const handleFileMove = () => {
        router.reload();
    };

    const handleEditFile = (file: FileItem) => {
        setFileToEdit(file);
        setShowEditModal(true);
    };

    const handleToggleStar = (fileId: number) => {
        post(`/files/${fileId}/toggle-star`, {}, {
            successMessage: SUCCESS_MESSAGES.FILE_STARRED,
            errorMessage: ERROR_MESSAGES.FILE_STAR_FAILED,
            onSuccess: () => {
                window.location.reload();
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'File Terbaru', href: '/recent' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="File Terbaru" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            File Terbaru
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {search ? `${sortedFiles.length} dari ${files.total}` : files.total} file • 30 hari terakhir
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                            <Share2 className="mr-2 h-4 w-4" />
                            Bagikan File
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari file terbaru..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
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
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <option value="updated_at">Tanggal Diubah</option>
                            <option value="name">Nama</option>
                            <option value="size">Ukuran</option>
                            <option value="created_at">Tanggal Dibuat</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <option value="desc">Terbaru</option>
                            <option value="asc">Terlama</option>
                        </select>
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
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedFiles.length} file dipilih
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleBulkDownload}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                                >
                                    <Download className="mr-1 h-3 w-3" />
                                    Download
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                >
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Files Grid/List */}
                {sortedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                            <Clock className="h-12 w-12 text-slate-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                            {search ? 'Tidak ada file yang cocok' : 'Tidak ada file terbaru'}
                        </h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {search
                                ? `Tidak ada file yang cocok dengan pencarian "${search}".`
                                : 'Tidak ada file yang dimodifikasi dalam 30 hari terakhir.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'space-y-2'
                    }>
                        {sortedFiles.map((file) => {
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
                                    <div className="flex items-start space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleFileSelection(file.id)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
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
                                                <div className="flex items-center space-x-1">
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <HardDrive className="h-3 w-3" />
                                                    <span>{formatFileSize(file.size)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FolderOpen className="h-3 w-3" />
                                                    <span>{file.folder?.name || 'Root'}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{file.user.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(file.updated_at).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Dropdown */}
                                    <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { const idx = files.data.findIndex(f => f.id === file.id); if (idx >= 0) { setPreviewIndex(idx); setShowFilePreview(true); } }}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Lihat
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStar(file.id)}>
                                                    <Star className={`h-4 w-4 mr-2 ${file.starred ? 'text-yellow-500 fill-current' : ''}`} />
                                                    {file.starred ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/files/${file.id}/download`, '_blank')}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleMoveFile(file.id, file.name)}>
                                                    <Move className="h-4 w-4 mr-2" />
                                                    Pindah
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditFile(file)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleShareFile(file)}>
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    Bagikan
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modals */}
                <FileUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUpload={handleFileUpload}
                    currentFolderId={undefined} // Recent files don't have a current folder context for upload
                    currentFolderName="Recent"
                    storageLocations={disks ?? []}
                />
                <CreateFolderModal
                    isOpen={showCreateFolderModal}
                    onClose={() => setShowCreateFolderModal(false)}
                    onCreate={handleFolderCreate}
                    parentId={undefined} // Recent files don't have a current folder context for create folder
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
                        currentFolderId={undefined} // Recent files don't have a current folder context for move
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
                        files={filesForModal}
                        selectedFiles={shareSelectionForModal}
                        users={users}
                        mode="user-selection"
                    />
                )}
                <FilePreviewModal
                    isOpen={showFilePreview}
                    onClose={() => setShowFilePreview(false)}
                    loggedinUser={window.Auth?.user}
                    filesInDirectory={filesForModal}
                    currentIndex={previewIndex}
                />

                {/* Pagination */}
                {files.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Menampilkan {((files.current_page - 1) * files.per_page) + 1} sampai {Math.min(files.current_page * files.per_page, files.total)} dari {files.total} hasil
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                disabled={files.current_page === 1}
                                onClick={() => router.get('/recent', { ...filters, page: files.current_page - 1 })}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Sebelumnya
                            </button>
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                Halaman {files.current_page} dari {files.last_page}
                            </span>
                            <button
                                disabled={files.current_page === files.last_page}
                                onClick={() => router.get('/recent', { ...filters, page: files.current_page + 1 })}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
