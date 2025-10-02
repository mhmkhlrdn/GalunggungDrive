import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { formatFileSize } from '@/lib/utils';
import FilePreview from '@/components/file-preview';
import FileEditModal from '@/components/file-edit-modal';
import ShareModal from '@/components/share-modal';
import {
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
    StarOff
} from 'lucide-react';
import { useState } from 'react';

interface File {
    id: number;
    name: string;
    size: string;
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
}

interface Props {
    files: {
        data: File[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    users: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    filters: {
        search: string;
        sort_by: string;
        sort_order: string;
    };
}

export default function StarredIndex({ files, users, filters }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<File | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareSelection, setShareSelection] = useState<File[]>([]);

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

    const clearSelection = () => {
        setSelectedFiles([]);
    };

    const handleViewFile = (fileId: number) => {
        window.open(`/files/${fileId}/preview`, '_blank');
    };

    const handleDownloadFile = (fileId: number) => {
        window.open(`/files/${fileId}/download`, '_blank');
    };

    const handleEditFile = (file: File) => {
        setFileToEdit(file);
        setShowEditModal(true);
    };

    const handleShareFile = (file: File) => {
        setShareSelection([file]);
        setShowShareModal(true);
    };

    const handleShare = async (fileIds: number[], userIds: number[], permission: string, expiresAt?: string, isPublicLink?: boolean) => {
        try {
            // Create share for each file
            fileIds.forEach(fileId => {
                if (isPublicLink) {
                    // Create public link
                    router.post(`/files/${fileId}/share`, {
                        is_public_link: true,
                        permission,
                        expires_at: expiresAt
                    });
                } else {
                    // Share with specific users
                    userIds.forEach(userId => {
                        router.post(`/files/${fileId}/share`, {
                            shared_with: userId,
                            permission,
                            expires_at: expiresAt
                        });
                    });
                }
            });

            // Reload the page to show updated shares
            router.reload();
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'File Favorit', href: '/starred' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Starred Files" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Starred Files
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {files.total} files • Your favorite files
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
                            placeholder="Cari file favorit..."
                            defaultValue={filters.search}
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
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedFiles.length} file dipilih
                            </span>
                            <div className="flex items-center space-x-2">
                                <button className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700">
                                    <StarOff className="mr-1 h-3 w-3" />
                                    Unstar
                                </button>
                                <button className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                                    <Download className="mr-1 h-3 w-3" />
                                    Download
                                </button>
                                <button className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
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
                            <Star className="h-12 w-12 text-slate-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">Tidak ada file favorit</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            Klik bintang pada file untuk menambahkannya ke favorit.
                        </p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
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
                                                    <button className="p-1 text-yellow-500 hover:text-yellow-600">
                                                        <Star className="h-4 w-4 fill-current" />
                                                    </button>
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {formatFileSize(file.size)} • {file.folder?.name || 'Root'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Modified {new Date(file.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleViewFile(file.id)}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="View file"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadFile(file.id)}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Download file"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleShareFile(file)}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Share file"
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditFile(file)}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Edit file"
                                            >
                                                <Edit className="h-4 w-4" />
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
                                disabled={files.current_page === 1}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Sebelumnya
                            </button>
                            <button
                                disabled={files.current_page === files.last_page}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* File Edit Modal */}
            <FileEditModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setFileToEdit(null);
                }}
                file={fileToEdit}
                users={users}
            />

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                onShare={handleShare}
                files={files.data}
                users={users}
                mode="file-selection"
            />
        </AppLayout>
    );
}
