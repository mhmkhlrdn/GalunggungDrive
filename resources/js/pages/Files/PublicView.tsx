import { Head } from '@inertiajs/react';
import { formatFileSize } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Download,
    ShieldCheck,
    Clock,
    Copy,
    Check,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    File as FileIcon,
    Link as LinkIcon,
} from 'lucide-react';
import { useState } from 'react';

interface FileOwner {
    name: string;
    email: string;
}

interface PublicFile {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    description?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    owner?: FileOwner | null;
}

interface PublicShare {
    token: string;
    permission: 'view' | 'download' | 'edit';
    expires_at?: string | null;
    created_at?: string | null;
    is_public_link: boolean;
}

interface Props {
    file: PublicFile;
    share: PublicShare;
    downloadUrl: string;
    publicUrl: string;
    canDownload: boolean;
}

const permissionLabels: Record<PublicShare['permission'], string> = {
    view: 'Hanya Lihat',
    download: 'Dapat Mengunduh',
    edit: 'Dapat Mengedit',
};

const getIconByMime = (mime: string) => {
    if (mime.startsWith('image/')) return Image;
    if (mime.startsWith('video/')) return Video;
    if (mime.startsWith('audio/')) return Music;
    if (mime === 'application/pdf') return FileText;
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return Archive;
    return FileIcon;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function PublicFileView({ file, share, downloadUrl, publicUrl, canDownload }: Props) {
    const [copied, setCopied] = useState(false);
    const FileIconComponent = getIconByMime(file.mime_type);

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
            <Head title={`${file.name} - Link Publik`} />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 dark:from-slate-900 dark:to-slate-950">
                <div className="mx-auto max-w-4xl space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-1 items-start gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                                    <FileIconComponent className="h-8 w-8" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                        {file.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <span>{formatFileSize(file.size)}</span>
                                        <span>•</span>
                                        <span>{file.mime_type || 'Tipe tidak diketahui'}</span>
                                        {file.owner && (
                                            <>
                                                <span>•</span>
                                                <span>Diunggah oleh {file.owner.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 md:w-56">
                                <Button
                                    asChild
                                    disabled={!canDownload}
                                    className="w-full"
                                >
                                    <a href={downloadUrl}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Unduh File
                                    </a>
                                </Button>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="inline-flex w-full items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4 text-green-500" />
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
                        </div>

                        {file.description && (
                            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{file.description}</p>
                        )}

                        <div className="mt-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm dark:border-slate-800 dark:bg-slate-800/60 md:grid-cols-3">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-900">
                                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Permission</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{permissionLabels[share.permission]}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-900">
                                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Kadaluarsa</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{share.expires_at ? formatDateTime(share.expires_at) : 'Tidak pernah'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-white p-2 shadow-sm dark:bg-slate-900">
                                    <LinkIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Link Publik</p>
                                    <div className="mt-1 line-clamp-2 break-all text-slate-900 dark:text-white">{publicUrl}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span>Dibuat: {formatDateTime(file.created_at)}</span>
                            <span>•</span>
                            <span>Diperbarui: {formatDateTime(file.updated_at)}</span>
                            {share.expires_at && (
                                <>
                                    <span>•</span>
                                    <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-200">
                                        Link akan kedaluwarsa {formatDateTime(share.expires_at)}
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

