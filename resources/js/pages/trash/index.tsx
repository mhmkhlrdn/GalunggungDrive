import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { formatFileSize } from '@/lib/utils';
import {
    Search,
    Filter,
    Grid3X3,
    List,
    MoreHorizontal,
    Trash2,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    File,
    RotateCcw,
    Trash,
    Folder
} from 'lucide-react';
import { useState } from 'react';

interface File {
    id: number;
    name: string;
    size: string;
    mime_type: string;
    deleted_at: string;
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

interface Folder {
    id: number;
    name: string;
    deleted_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface Props {
    files?: {
        data: File[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    folders?: {
        data: Folder[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search: string;
        type: string;
        sort_by: string;
        sort_order: string;
    };
}

export default function TrashIndex({ files, folders, filters }: Props) {
    const handleEmptyTrash = () => {
        if (!confirm('Kosongkan sampah secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
        router.post('/trash/empty');
    };

    const handleRestoreFile = (fileId: number) => {
        router.post(`/trash/files/${fileId}/restore`);
    };

    const handleForceDeleteFile = (fileId: number) => {
        if (!confirm('Hapus file ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
        router.delete(`/trash/files/${fileId}/force`);
    };

    const handleRestoreFolder = (folderId: number) => {
        router.post(`/trash/folders/${folderId}/restore`);
    };

    const handleForceDeleteFolder = (folderId: number) => {
        if (!confirm('Hapus folder ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
        router.delete(`/trash/folders/${folderId}/force`);
    };

    const handleBulkRestore = () => {
        if (selectedItems.length === 0) return;
        if (activeTab === 'files') {
            selectedItems.forEach(id => handleRestoreFile(id));
        } else if (activeTab === 'folders') {
            selectedItems.forEach(id => handleRestoreFolder(id));
        }
        clearSelection();
    };

    const handleBulkForceDelete = () => {
        if (selectedItems.length === 0) return;
        if (!confirm(`Hapus ${selectedItems.length} item yang dipilih secara permanen?`)) return;
        if (activeTab === 'files') {
            selectedItems.forEach(id => handleForceDeleteFile(id));
        } else if (activeTab === 'folders') {
            selectedItems.forEach(id => handleForceDeleteFolder(id));
        }
        clearSelection();
    };
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'files' | 'folders'>(filters.type as any || 'all');

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

    const toggleItemSelection = (itemId: number) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const clearSelection = () => {
        setSelectedItems([]);
    };

    const getCurrentData = () => {
        if (activeTab === 'files') return files;
        if (activeTab === 'folders') return folders;
        return null; // For 'all' tab, we'll show both
    };

    const getTotalItems = () => {
        const fileCount = files?.total || 0;
        const folderCount = folders?.total || 0;
        return fileCount + folderCount;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Sampah', href: '/trash' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sampah" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Sampah
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {getTotalItems()} item • File dan folder yang dihapus
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={handleEmptyTrash} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Kosongkan Sampah
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'all'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            Semua ({getTotalItems()})
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'files'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            File ({files?.total || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('folders')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'folders'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            Folder ({folders?.total || 0})
                        </button>
                    </nav>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari file yang dihapus..."
                            defaultValue={filters.search}
                            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        {selectedItems.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    {selectedItems.length} dipilih
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
                {selectedItems.length > 0 && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedItems.length} item dipilih
                            </span>
                            <div className="flex items-center space-x-2">
                                <button onClick={handleBulkRestore} className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                                    <RotateCcw className="mr-1 h-3 w-3" />
                                    Pulihkan
                                </button>
                                <button onClick={handleBulkForceDelete} className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                                    <Trash className="mr-1 h-3 w-3" />
                                    Hapus Selamanya
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Items Grid/List */}
                {getTotalItems() === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                            <Trash2 className="h-12 w-12 text-slate-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">Sampah kosong</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            File dan folder yang dihapus akan muncul di sini.
                        </p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'space-y-2'
                    }>
                        {/* Files */}
                        {(activeTab === 'all' || activeTab === 'files') && files?.data.map((file) => {
                            const IconComponent = getFileIcon(file.mime_type);
                            const isSelected = selectedItems.includes(file.id);

                            return (
                                <div
                                    key={`file-${file.id}`}
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
                                            onChange={() => toggleItemSelection(file.id)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className={`flex-shrink-0 ${viewMode === 'list' ? 'mt-0' : 'mt-1'}`}>
                                            <IconComponent className={`h-8 w-8 ${getFileColor(file.mime_type)}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {file.name}
                                                </h3>
                                                <div className="flex items-center space-x-1">
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {formatFileSize(file.size)} • {file.folder?.name || 'Root'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Dihapus {new Date(file.deleted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleRestoreFile(file.id)} className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50">
                                                <RotateCcw className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleForceDeleteFile(file.id)} className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50">
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Folders */}
                        {(activeTab === 'all' || activeTab === 'folders') && folders?.data.map((folder) => {
                            const isSelected = selectedItems.includes(folder.id);

                            return (
                                <div
                                    key={`folder-${folder.id}`}
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
                                            onChange={() => toggleItemSelection(folder.id)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className={`flex-shrink-0 ${viewMode === 'list' ? 'mt-0' : 'mt-1'}`}>
                                            <Folder className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {folder.name}
                                                </h3>
                                                <div className="flex items-center space-x-1">
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Dihapus {new Date(folder.deleted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleRestoreFolder(folder.id)} className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50">
                                                <RotateCcw className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleForceDeleteFolder(folder.id)} className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50">
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {getCurrentData() && getCurrentData()!.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Menampilkan {((getCurrentData()!.current_page - 1) * getCurrentData()!.per_page) + 1} sampai {Math.min(getCurrentData()!.current_page * getCurrentData()!.per_page, getCurrentData()!.total)} dari {getCurrentData()!.total} hasil
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                disabled={getCurrentData()!.current_page === 1}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Sebelumnya
                            </button>
                            <button
                                disabled={getCurrentData()!.current_page === getCurrentData()!.last_page}
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
