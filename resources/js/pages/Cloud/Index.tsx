import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { FolderOpen, FileText, Download, Trash2, Search, Grid3X3, List } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CloudFile {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    updated_at: string;
    visibility: 'private' | 'shared' | 'public';
}

interface CloudFolder {
    id: number;
    name: string;
    updated_at: string;
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
    breadcrumbs: Array<{ title: string; href: string }>;
    filters?: { search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' };
}

export default function CloudIndex({ folders, files, breadcrumbs, filters = {} }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState(filters.search || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order || 'desc');

    const searchDebounceRef = useRef<number | null>(null);
    useEffect(() => {
        if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = window.setTimeout(() => {
            router.get('/cloud', { search, sort_by: sortBy, sort_order: sortOrder }, { preserveState: true, replace: true });
        }, 300);
        return () => { if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current); };
    }, [search, sortBy, sortOrder]);

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
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari..." className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
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
                    {folders.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400">Tidak ada folder.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {folders.map((folder) => (
                                <Link key={folder.id} href={`/folders/${folder.id}`} className="group rounded-lg border p-4 hover:shadow-md dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <FolderOpen className="h-6 w-6 text-blue-600" />
                                        <div>
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{folder.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Diperbarui {new Date(folder.updated_at).toLocaleString()}</div>
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
                    {files.data.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400">Tidak ada file.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {files.data.map((file) => (
                                <div key={file.id} className="group rounded-lg border p-4 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-6 w-6 text-slate-600" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)} • {new Date(file.updated_at).toLocaleString()}</div>
                                        </div>
                                        <div className="flex items-center space-x-1">
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


