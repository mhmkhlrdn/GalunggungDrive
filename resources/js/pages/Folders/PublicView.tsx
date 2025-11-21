import { Head } from '@inertiajs/react';
import { formatFileSize } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Folder as FolderIcon,
    FolderOpen,
    File as FileIcon,
    Users,
    Clock,
    Copy,
    Check,
    Layers,
    HardDrive,
    Link as LinkIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface FolderOwner {
    name: string;
    email: string;
}

interface FolderFile {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    created_at?: string | null;
}

interface FolderChild {
    id: number;
    name: string;
    created_at?: string | null;
}

interface PublicFolder {
    id: number;
    name: string;
    path?: string;
    owner?: FolderOwner | null;
    stats: {
        files_count: number;
        folders_count: number;
        total_size: number;
    };
    files: FolderFile[];
    subfolders: FolderChild[];
}

interface PublicShare {
    token: string;
    permission: 'view' | 'edit';
    expires_at?: string | null;
    created_at?: string | null;
    is_public_link: boolean;
}

interface Props {
    folder: PublicFolder;
    share: PublicShare;
    publicUrl: string;
}

const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export default function PublicFolderView({ folder, share, publicUrl }: Props) {
    const [copied, setCopied] = useState(false);

    const folderPath = useMemo(() => {
        if (!folder.path) return folder.name;
        return folder.path;
    }, [folder.path, folder.name]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <>
            <Head title={`${folder.name} - Folder Publik`} />
            <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 px-4 py-10 dark:from-slate-950 dark:to-slate-900">
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
                                    <FolderOpen className="h-9 w-9" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                            {folder.name}
                                        </h1>
                                        <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-100">
                                            Folder Publik
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {folderPath}
                                    </p>
                                    {folder.owner && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Pemilik: {folder.owner.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4 text-emerald-500" />
                                        Link Disalin
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Salin Link
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm dark:border-slate-800 dark:bg-slate-800/60 md:grid-cols-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-900">
                                    <FolderIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Subfolder</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{folder.stats.folders_count}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-900">
                                    <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">File</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{folder.stats.files_count}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-900">
                                    <HardDrive className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Total Size</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatFileSize(folder.stats.total_size)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-900">
                                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Permission</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {share.permission === 'edit' ? 'Edit' : 'Lihat'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border border-slate-100 bg-white/60 p-4 text-sm shadow-inner dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-blue-50 p-2 dark:bg-blue-500/10">
                                    <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Link Publik</p>
                                    <p className="break-all text-slate-900 dark:text-white">{publicUrl}</p>
                                    {share.expires_at ? (
                                        <p className="text-xs text-amber-600 dark:text-amber-300">
                                            Kadaluarsa pada {formatDate(share.expires_at)}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-300">Tidak ada kadaluarsa</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-slate-500" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Subfolder</h2>
                            </div>
                            {folder.subfolders.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada subfolder.</p>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {folder.subfolders.map((subfolder) => (
                                        <div key={subfolder.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                    <FolderIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{subfolder.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Dibuat {formatDate(subfolder.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-2">
                                <FileIcon className="h-5 w-5 text-slate-500" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">File</h2>
                            </div>
                            {folder.files.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada file pada folder ini.</p>
                            ) : (
                                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                                    {folder.files.map((file) => (
                                        <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                    <FileIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Dibuat {formatDate(file.created_at)}</p>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {formatFileSize(file.size)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Link dibuat pada {formatDate(share.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

