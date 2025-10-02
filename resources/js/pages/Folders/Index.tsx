import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { formatFileSize } from '@/lib/utils';
import {
    FolderPlus,
    Search,
    Filter,
    Grid3X3,
    List,
    MoreHorizontal,
    Star,
    Share2,
    Trash2,
    Eye,
    Edit,
    Folder,
    FolderOpen,
    FileText,
    Clock,
    Users,
    Download,
    Calendar,
    HardDrive
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import CreateFolderModal from '@/components/create-folder-modal';

interface FolderItem {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    files_count: number;
    total_size: string;
    parent?: {
        id: number;
        name: string;
    };
}

interface Props {
    folders: {
        data: FolderItem[];
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
    users: Array<{ id: number; name: string; email: string }>;
}

export default function FoldersIndex({ folders, currentFolder, breadcrumbs, filters, users }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFolders, setSelectedFolders] = useState<number[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareFolderId, setShareFolderId] = useState<number | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameFolder, setRenameFolder] = useState<{ id: number; name: string } | null>(null);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    // Open modal based on ?action= query param on first load
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            if (action === 'create') {
                setShowCreateFolderModal(true);
            }
            if (action) {
                params.delete('action');
                const query = params.toString();
                const newUrl = window.location.pathname + (query ? `?${query}` : '');
                window.history.replaceState({}, '', newUrl);
            }
        } catch {}
    }, []);

    const shareForm = useForm({
        shared_with: '' as string,
        permission: 'view' as 'view' | 'edit',
        is_public_link: false as boolean,
        expires_at: '' as string,
    });

    const renameForm = useForm({
        name: '',
    });

    const toggleFolderSelection = (folderId: number) => {
        setSelectedFolders(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        );
    };

    const selectAllFolders = () => {
        setSelectedFolders(folders.data.map(folder => folder.id));
    };

    const clearSelection = () => {
        setSelectedFolders([]);
    };

    const handleDeleteFolder = (folderId: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus folder ini?')) return;
        router.delete(`/folders/${folderId}`);
    };

    const handleBulkDelete = () => {
        if (selectedFolders.length === 0) return;
        if (!confirm(`Hapus ${selectedFolders.length} folder terpilih?`)) return;
        selectedFolders.forEach(id => router.delete(`/folders/${id}`));
        router.reload();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Kemarin';
        if (diffDays < 7) return `${diffDays} hari lalu`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} minggu lalu`;
        return date.toLocaleDateString('id-ID');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Folder" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {currentFolder ? currentFolder.name : 'Folder'}
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {folders.total} folder • {currentFolder ? 'dalam folder ini' : 'total'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowCreateFolderModal(true)}
                            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl">
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
                            placeholder="Cari folder..."
                            defaultValue={filters.search}
                            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                <div className="flex items-center space-x-2">
                        {selectedFolders.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    {selectedFolders.length} dipilih
                                </span>
                                <button
                                    onClick={clearSelection}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Hapus
                                </button>
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-slate-600 dark:text-slate-300">Sort by</label>
                            <select
                                defaultValue={filters.sort_by}
                                onChange={(e) => router.get('/folders', { sort_by: e.target.value, sort_order: filters.sort_order, search: filters.search }, { preserveState: true, replace: true })}
                                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="name">Name</option>
                                <option value="updated_at">Updated</option>
                                <option value="created_at">Created</option>
                            </select>
                            <select
                                defaultValue={filters.sort_order}
                                onChange={(e) => router.get('/folders', { sort_by: filters.sort_by, sort_order: e.target.value, search: filters.search }, { preserveState: true, replace: true })}
                                className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="asc">Asc</option>
                                <option value="desc">Desc</option>
                            </select>
                        </div>
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
                {selectedFolders.length > 0 && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedFolders.length} folder dipilih
                            </span>
                            <div className="flex items-center space-x-2">
                                <button className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                                    <Share2 className="mr-1 h-3 w-3" />
                                    Bagikan
                                </button>
                                <button onClick={handleBulkDelete} className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Folders Grid/List */}
                {folders.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                            <Folder className="h-12 w-12 text-slate-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">Tidak ada folder ditemukan</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {filters.search ? 'Coba sesuaikan kata kunci pencarian Anda.' : 'Buat folder pertama Anda untuk memulai.'}
                        </p>
                        {!filters.search && (
                            <button
                                onClick={() => setShowCreateFolderModal(true)}
                                className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-blue-700 hover:to-indigo-700">
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Folder Baru
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'space-y-2'
                    }>
                        {folders.data.map((folder) => {
                            const isSelected = selectedFolders.includes(folder.id);

                            return (
                                <div
                                    key={folder.id}
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
                                            onChange={() => toggleFolderSelection(folder.id)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className={`flex-shrink-0 ${viewMode === 'list' ? 'mt-0' : 'mt-1'}`}>
                                            <FolderOpen className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {folder.name}
                                                </h3>
                                                <div className="flex items-center space-x-1">
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <Star className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    <span>{folder.files_count}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <HardDrive className="h-3 w-3" />
                                                    <span>{formatFileSize(folder.total_size)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(folder.updated_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="pointer-events-auto flex items-center space-x-2">
                                            <Link
                                                href={`/folders/${folder.id}`}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="View folder"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => window.open(`/folders/${folder.id}/download`, '_blank')}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Download folder as ZIP"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShareFolderId(folder.id);
                                                    setShowShareModal(true);
                                                }}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Share folder"
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRenameFolder({ id: folder.id, name: folder.name });
                                                    renameForm.setData('name', folder.name);
                                                    setShowRenameModal(true);
                                                }}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Rename folder"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFolder(folder.id)}
                                                className="rounded-full bg-white p-2 text-red-600 hover:bg-red-50"
                                                title="Hapus folder"
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
                {folders.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Menampilkan {((folders.current_page - 1) * folders.per_page) + 1} sampai {Math.min(folders.current_page * folders.per_page, folders.total)} dari {folders.total} hasil
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                disabled={folders.current_page === 1}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Sebelumnya
                            </button>
                            <button
                                disabled={folders.current_page === folders.last_page}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            <Dialog open={showShareModal} onOpenChange={(open) => { if (!open) { setShowShareModal(false); setShareFolderId(null); shareForm.reset(); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bagikan Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pilih Pengguna</label>
                            <Select value={shareForm.data.shared_with} onValueChange={(v) => shareForm.setData('shared_with', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih pengguna" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.email})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Izin</label>
                            <Select value={shareForm.data.permission} onValueChange={(v) => shareForm.setData('permission', v as 'view' | 'edit')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih izin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">Lihat</SelectItem>
                                    <SelectItem value="edit">Edit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowShareModal(false); setShareFolderId(null); }}>Batal</Button>
                            <Button
                                onClick={() => {
                                    if (!shareFolderId) return;
                                    shareForm.post(`/folders/${shareFolderId}/share`, {
                                        preserveScroll: true,
                                        onSuccess: () => { setShowShareModal(false); setShareFolderId(null); shareForm.reset(); },
                                    });
                                }}
                                disabled={!shareForm.data.shared_with}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Bagikan
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rename Modal */}
            <Dialog open={showRenameModal} onOpenChange={(open) => { if (!open) { setShowRenameModal(false); setRenameFolder(null); renameForm.reset(); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ganti Nama Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nama</label>
                            <Input value={renameForm.data.name} onChange={(e) => renameForm.setData('name', e.target.value)} />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowRenameModal(false); setRenameFolder(null); }}>Batal</Button>
                            <Button
                                onClick={() => {
                                    if (!renameFolder) return;
                                    renameForm.put(`/folders/${renameFolder.id}`, {
                                        preserveScroll: true,
                                        onSuccess: () => { setShowRenameModal(false); setRenameFolder(null); },
                                    });
                                }}
                                disabled={!renameForm.data.name || renameForm.processing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Simpan
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Create Folder Modal (shared with dashboard) */}
            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onCreate={() => router.reload()}
                parentId={currentFolder?.id}
            />
        </AppLayout>
    );
}
