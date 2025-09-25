import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { FolderOpen, FileText, Download } from 'lucide-react';
import { useState } from 'react';

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
}

export default function CloudIndex({ folders, files, breadcrumbs }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Semua di Cloud</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">Folder dan file yang Anda miliki atau publik</p>
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
                                        <button
                                            onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
                                            className="rounded bg-white p-2 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                                            title="Download file"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
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


