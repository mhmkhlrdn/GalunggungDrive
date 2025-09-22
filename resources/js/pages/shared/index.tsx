import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
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
    Users,
    Clock,
    ExternalLink,
    Copy,
    Settings,
    Check
} from 'lucide-react';
import { useState } from 'react';

interface FileShare {
    id: number;
    file: {
        id: number;
        name: string;
        size: string;
        mime_type: string;
    };
    sharedWith?: {
        id: number;
        name: string;
        email: string;
    };
    sharedBy?: {
        id: number;
        name: string;
        email: string;
    };
    permission: 'view' | 'edit' | 'download';
    expires_at?: string;
    token?: string;
    is_public_link: boolean;
    created_at: string;
}

interface Props {
    sharedByMe: {
        data: FileShare[];
        links: {
            first: string;
            last: string;
            prev: string;
            next: string;
        };
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    sharedWithMe: {
        data: FileShare[];
        links: {
            first: string;
            last: string;
            prev: string;
            next: string;
        };
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    publicLinks: {
        data: FileShare[];
        links: {
            first: string;
            last: string;
            prev: string;
            next: string;
        };
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

export default function SharedIndex({ sharedByMe, sharedWithMe, publicLinks }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<'shared-by-me' | 'shared-with-me' | 'public-links'>('shared-by-me');
    const [copiedTokens, setCopiedTokens] = useState<Set<string>>(new Set());


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

    const getPermissionColor = (permission: string) => {
        switch (permission) {
            case 'view': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'edit': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            case 'download': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
        }
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

    const copyToClipboard = (text: string, token: string) => {
        navigator.clipboard.writeText(text);
        setCopiedTokens(prev => new Set(prev).add(token));
        setTimeout(() => {
            setCopiedTokens(prev => {
                const newSet = new Set(prev);
                newSet.delete(token);
                return newSet;
            });
        }, 2000);
    };

    const getCurrentData = () => {
        const defaultData = {
            data: [],
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: 20,
                total: 0
            },
            links: {
                first: null,
                last: null,
                prev: null,
                next: null
            }
        };

        switch (activeTab) {
            case 'shared-by-me':
                return sharedByMe || defaultData;
            case 'shared-with-me':
                return sharedWithMe || defaultData;
            case 'public-links':
                return publicLinks || defaultData;
            default:
                return sharedByMe || defaultData;
        }
    };

    const getTabTitle = () => {
        switch (activeTab) {
            case 'shared-by-me':
                return 'Dibagikan oleh Saya';
            case 'shared-with-me':
                return 'Dibagikan dengan Saya';
            case 'public-links':
                return 'Link Publik';
            default:
                return 'Dibagikan';
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'File Dibagikan', href: '/shared' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="File Dibagikan" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            File Dibagikan
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {getCurrentData().meta.total} file • {getTabTitle()}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                            <Share2 className="mr-2 h-4 w-4" />
                            Bagikan File
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('shared-by-me')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'shared-by-me'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            Dibagikan oleh Saya ({sharedByMe.meta.total})
                        </button>
                        <button
                            onClick={() => setActiveTab('shared-with-me')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'shared-with-me'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            Dibagikan dengan Saya ({sharedWithMe.meta.total})
                        </button>
                        <button
                            onClick={() => setActiveTab('public-links')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'public-links'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            Link Publik ({publicLinks.meta.total})
                        </button>
                    </nav>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari file yang dibagikan..."
                            defaultValue=""
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

                {/* Shared Files Grid/List */}
                {getCurrentData().data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                            <Share2 className="h-12 w-12 text-slate-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">Tidak ada file yang dibagikan</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            Tidak ada file di kategori {getTabTitle().toLowerCase()}.
                        </p>
                        {activeTab === 'shared-by-me' && (
                            <button className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-blue-700 hover:to-indigo-700">
                                <Share2 className="mr-2 h-4 w-4" />
                                Bagikan File
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                        : 'space-y-2'
                    }>
                        {getCurrentData().data.map((share) => {
                            const file = share.file;
                            const IconComponent = getFileIcon(file.mime_type);
                            const isSelected = selectedFiles.includes(share.id);
                            const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
                            
                            return (
                                <div
                                    key={share.id}
                                    className={`group relative rounded-lg border-2 p-4 transition-all hover:shadow-lg dark:border-slate-700 ${
                                        isSelected 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                            : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-800 dark:hover:border-slate-600'
                                    } ${isExpired ? 'opacity-60' : ''} ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleFileSelection(share.id)}
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
                                                        <Star className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPermissionColor(share.permission)}`}>
                                                    {share.permission}
                                                </span>
                                                {share.is_public_link && (
                                                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                                                        Public
                                                    </span>
                                                )}
                                                {isExpired && (
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                                        Expired
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {file.size} • {activeTab === 'shared-by-me' ? `Shared with ${share.sharedWith?.name || 'Public'}` : `Shared by ${share.sharedBy?.name}`}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(share.created_at).toLocaleDateString()}
                                            </p>
                                            {share.expires_at && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Expires {new Date(share.expires_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Quick Actions */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex items-center space-x-2">
                                            <button className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50">
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {share.token && (
                                                <button 
                                                    onClick={() => copyToClipboard(`${window.location.origin}/public/file/${share.token}`, share.token!)}
                                                    className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                >
                                                    {copiedTokens.has(share.token) ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </button>
                                            )}
                                            <button className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50">
                                                <Settings className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {getCurrentData().meta.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Menampilkan {((getCurrentData().meta.current_page - 1) * getCurrentData().meta.per_page) + 1} sampai {Math.min(getCurrentData().meta.current_page * getCurrentData().meta.per_page, getCurrentData().meta.total)} dari {getCurrentData().meta.total} hasil
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                disabled={getCurrentData().meta.current_page === 1}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Sebelumnya
                            </button>
                            <button
                                disabled={getCurrentData().meta.current_page === getCurrentData().meta.last_page}
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
