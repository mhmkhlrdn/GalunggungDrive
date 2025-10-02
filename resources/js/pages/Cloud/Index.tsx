import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { FolderOpen, FileText, Download, Trash2, Search, Grid3X3, List, Eye, User, Calendar, HardDrive } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fuzzyFilter } from '@/lib/utils';

interface CloudFile {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    updated_at: string;
    visibility: 'private' | 'shared' | 'public';
    user: {
        id: number;
        name: string;
    };
    folder?: {
        id: number;
        name: string;
    } | null;
}

interface CloudFolder {
    id: number;
    name: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface Props {
    folders: CloudFolder[];
    files: {
        data: CloudFile[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    allFiles: CloudFile[];
    breadcrumbs: Array<{ title: string; href: string }>;
    filters?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' };
}

export default function CloudIndex({ folders, files, allFiles, breadcrumbs, filters = {} }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState(filters.search || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order || 'desc');
    const [draggingFileId, setDraggingFileId] = useState<number | null>(null);
    const [hoverFolderId, setHoverFolderId] = useState<number | null>(null);

    const searchDebounceRef = useRef<number | null>(null);
    // Client-side fuzzy filtering for folders and files
    const filteredFolders = fuzzyFilter(
        folders,
        search,
        (folder) => folder.name,
        0.2
    );

    // Use allFiles for search to include files from all folders, otherwise use root files
    const filesToSearch = search.trim() ? allFiles : files.data;
    const filteredFiles = fuzzyFilter(
        filesToSearch,
        search,
        (file) => `${file.name} ${file.user.name} ${file.folder?.name || ''}`,
        0.2
    );

    const formatFileSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let i = 0;
        while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
        return `${size.toFixed(1)} ${units[i]}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs as any}>
            <Head title="Cloud" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Semua di Cloud</h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">Folder dan file yang Anda miliki atau publik</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari file dan folder (termasuk dalam subfolder)..." className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                        </div>
                        <label className="text-sm text-slate-600 dark:text-slate-300">Urutkan</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                            <option value="name">Alfabet</option>
                            <option value="size">Ukuran</option>
                            <option value="updated_at">Tanggal</option>
                        </select>
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                            <option value="asc">Naik</option>
                            <option value="desc">Turun</option>
                        </select>
                        <div className="flex rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}><Grid3X3 className="h-4 w-4" /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}><List className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>

                {/* Folders */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Folder</h2>
                    {filteredFolders.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400">Tidak ada folder.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredFolders.map((folder) => (
                                <Link
                                    key={folder.id}
                                    href={`/folders/${folder.id}?from=cloud`}
                                    className={`group rounded-lg border p-4 hover:shadow-md dark:border-slate-700 transition-colors ${hoverFolderId === folder.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setHoverFolderId(folder.id); }}
                                    onDragEnter={(e) => { e.preventDefault(); setHoverFolderId(folder.id); }}
                                    onDragLeave={(e) => { if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return; setHoverFolderId((prev) => (prev === folder.id ? null : prev)); }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const fileId = e.dataTransfer.getData('text/plain');
                                        setHoverFolderId(null);
                                        setDraggingFileId(null);
                                        if (!fileId) return;
                                        router.post(`/files/${fileId}/move`, { folder_id: folder.id }, { preserveScroll: true });
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <FolderOpen className="h-6 w-6 text-blue-600" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{folder.name}</div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{folder.user.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(folder.updated_at).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Files */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">File</h2>
                    {filteredFiles.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400">Tidak ada file.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={`group rounded-lg border p-4 dark:border-slate-700 ${draggingFileId === file.id ? 'opacity-60' : ''}`}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', String(file.id));
                                        e.dataTransfer.effectAllowed = 'move';
                                        setDraggingFileId(file.id);
                                    }}
                                    onDragEnd={() => { setDraggingFileId(null); setHoverFolderId(null); }}
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-6 w-6 text-slate-600" />
                                        <div className="min-w-0 flex-1">
                                            <button
                                                onClick={() => window.open(`/files/${file.id}/preview`, '_blank')}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate text-left w-full"
                                                title="Click to preview file"
                                            >
                                                {file.name}
                                            </button>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {file.folder && (
                                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                        <FolderOpen className="h-3 w-3" />
                                                        <span>{file.folder.name}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{file.user.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <HardDrive className="h-3 w-3" />
                                                    <span>{formatFileSize(file.size)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(file.updated_at).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            <button
                                                onClick={() => window.open(`/files/${file.id}/preview`, '_blank')}
                                                className="rounded bg-white p-2 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                title="Preview file"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
                                                className="rounded bg-white p-2 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                title="Download file"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this file?')) {
                                                        router.delete(`/files/${file.id}`);
                                                    }
                                                }}
                                                className="rounded bg-white p-2 text-red-600 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-700"
                                                title="Delete file"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}


