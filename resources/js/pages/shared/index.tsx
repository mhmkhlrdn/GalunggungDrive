import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { formatFileSize } from '@/lib/utils';
import FilePreview from '@/components/file-preview';
import ShareManagementModal from '@/components/share-management-modal';
import FileEditModal from '@/components/file-edit-modal';
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
import ShareModal from '@/components/share-modal';

// SharedByMeView Component
interface SharedByMeViewProps {
    files: SharedFile[];
    viewMode: 'grid' | 'list';
    selectedFiles: number[];
    toggleFileSelection: (fileId: number) => void;
    copyToClipboard: (text: string, token: string) => void;
    copiedTokens: Set<string>;
    onManageShares: (file: any) => void;
}

function SharedByMeView({ files, viewMode, selectedFiles, toggleFileSelection, copyToClipboard, copiedTokens, onManageShares }: SharedByMeViewProps) {
    const getPermissionColor = (permission: string) => {
        switch (permission) {
            case 'view': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'edit': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            case 'download': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
        }
    };

    // Group files by sharing status
    const groupedFiles = files.reduce((acc, file) => {
        const publicShares = file.shares.filter(share => share.is_public_link);
        const userShares = file.shares.filter(share => !share.is_public_link);
        
        if (publicShares.length > 0) {
            if (!acc.public) acc.public = [];
            acc.public.push({ ...file, shares: publicShares });
        }
        
        if (userShares.length > 0) {
            if (!acc.shared) acc.shared = [];
            acc.shared.push({ ...file, shares: userShares });
        }
        
        return acc;
    }, {} as { public?: SharedFile[], shared?: SharedFile[] });

    const renderFileCard = (file: SharedFile) => {
        const isSelected = selectedFiles.includes(file.id);
        const hasExpiredShares = file.shares.some(share => share.expires_at && new Date(share.expires_at) < new Date());
        
        return (
            <div
                key={file.id}
                className={`group relative rounded-lg border-2 p-4 transition-all hover:shadow-lg dark:border-slate-700 min-w-0 ${
                    isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-800 dark:hover:border-slate-600'
                } ${hasExpiredShares ? 'opacity-60' : ''} ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}
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
                                <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                    <Star className="h-4 w-4" />
                                </button>
                                <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Status Berbagi */}
                        <div className="mt-2 space-y-2">
                            {file.shares.map((share, index) => {
                                const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
                                
                                return (
                                    <div key={index} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-700/50 p-2 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPermissionColor(share.permission)}`}>
                                                {share.permission === 'view' ? 'Lihat' : share.permission === 'edit' ? 'Edit' : 'Download'}
                                            </span>
                                            {share.is_public_link && (
                                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                                                    Link Publik
                                                </span>
                                            )}
                                            {isExpired && (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                                    Kedaluwarsa
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex-1 min-w-0">
                                                {share.is_public_link ? (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        Siapa saja dengan link
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400" title={(() => {
                                                        if (share.shared_with_user?.name) return share.shared_with_user.name;
                                                        if (share.sharedWith?.name) return share.sharedWith.name;
                                                        if (share.shared_with && typeof share.shared_with === 'object' && 'name' in share.shared_with) {
                                                            return share.shared_with.name;
                                                        }
                                                        if (share.shared_with && typeof share.shared_with === 'number') {
                                                            return `ID Pengguna: ${share.shared_with}`;
                                                        }
                                                        return 'Tidak Diketahui';
                                                    })()}>
                                                        {(() => {
                                                            if (share.shared_with_user?.name) return share.shared_with_user.name;
                                                            if (share.sharedWith?.name) return share.sharedWith.name;
                                                            if (share.shared_with && typeof share.shared_with === 'object' && 'name' in share.shared_with) {
                                                                return share.shared_with.name;
                                                            }
                                                            if (share.shared_with && typeof share.shared_with === 'number') {
                                                                return `ID Pengguna: ${share.shared_with}`;
                                                            }
                                                            return 'Tidak Diketahui';
                                                        })()}
                                                    </span>
                                                )}
                                            </div>
                                            {share.token && (
                                                <button 
                                                    onClick={() => copyToClipboard(`${window.location.origin}/public/file/${share.token}`, share.token!)}
                                                    className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
                                                >
                                                    {copiedTokens.has(share.token) ? (
                                                        <Check className="h-3 w-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {formatFileSize(file.size)} • Diperbarui {new Date(file.updated_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                
                {/* Quick Actions */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => window.open(`/files/${file.id}/preview`, '_blank')}
                            className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                            title="Lihat file"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
                            className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                            title="Unduh file"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => onManageShares(file)}
                            className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                            title="Kelola berbagi"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Public Files Section */}
            {groupedFiles.public && groupedFiles.public.length > 0 && (
                <div className="space-y-3">
                    <div className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4">
                        <div className="flex items-center space-x-3">
                            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
                                <ExternalLink className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                                    File Publik
                                </h3>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    {groupedFiles.public.length} file dapat diakses oleh siapa saja dengan link
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="rounded-full bg-orange-200 dark:bg-orange-800 px-2 py-1 text-xs font-medium text-orange-800 dark:text-orange-200">
                                {groupedFiles.public.length}
                            </span>
                        </div>
                    </div>
                    
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
                        : 'space-y-2'
                    }>
                        {groupedFiles.public.map(renderFileCard)}
                    </div>
                </div>
            )}

            {/* Shared with Users Section */}
            {groupedFiles.shared && groupedFiles.shared.length > 0 && (
                <div className="space-y-3">
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
                        : 'space-y-2'
                    }>
                        {groupedFiles.shared.map(renderFileCard)}
                    </div>
                </div>
            )}

            {/* No files message */}
            {(!groupedFiles.public || groupedFiles.public.length === 0) && (!groupedFiles.shared || groupedFiles.shared.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                        <Share2 className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">Belum ada file yang dibagikan</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                        Mulai berbagi file Anda untuk melihatnya diorganisir di sini.
                    </p>
                </div>
            )}
        </div>
    );
}

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
    shared_with_user?: {
        id: number;
        name: string;
        email: string;
    };
    shared_with?: number | {
        id: number;
        name: string;
        email: string;
        role: string;
        created_at: string;
        updated_at: string;
        last_login_at: string;
        last_login_ip: string;
        storage_limit: number;
        storage_used: number;
        current_session_id: string | null;
        deleted_at: string | null;
        two_factor_confirmed_at: string | null;
        two_factor_recovery_codes: string | null;
        two_factor_secret: string | null;
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

interface SharedFile {
    id: number;
    name: string;
    size: string;
    mime_type: string;
    folder?: {
        id: number;
        name: string;
    };
    shares: FileShare[];
    created_at: string;
    updated_at: string;
}

interface Props {
    sharedByMe: {
        data: SharedFile[];
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
    files?: Array<{
        id: number;
        name: string;
        mime_type: string;
        size: string;
        folder?: {
            id: number;
            name: string;
        };
    }>;
    users?: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}

export default function SharedIndex({ sharedByMe, sharedWithMe, publicLinks, files = [], users = [] }: Props) {
    
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<'shared-by-me' | 'shared-with-me' | 'public-links'>('shared-by-me');
    const [copiedTokens, setCopiedTokens] = useState<Set<string>>(new Set());
    const [showShareModal, setShowShareModal] = useState(false);
    const [showShareManagementModal, setShowShareManagementModal] = useState(false);
    const [selectedFileForManagement, setSelectedFileForManagement] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<any>(null);

    // Safety check to prevent crashes
    if (!sharedByMe || !sharedWithMe || !publicLinks) {
        return (
            <AppLayout breadcrumbs={[{ title: 'File Dibagikan', href: '/shared' }]}>
                <Head title="File Dibagikan" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </AppLayout>
        );
    }


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

    const handleShare = (fileIds: number[], userIds: number[], permission: string, expiresAt?: string, isPublicLink?: boolean) => {
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
    };

    const handleEditFile = (file: any) => {
        setFileToEdit(file);
        setShowEditModal(true);
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

        let currentData;
        switch (activeTab) {
            case 'shared-by-me':
                currentData = sharedByMe;
                break;
            case 'shared-with-me':
                currentData = sharedWithMe;
                break;
            case 'public-links':
                currentData = publicLinks;
                break;
            default:
                currentData = sharedByMe;
        }

        // Ensure we always return a valid structure
        if (!currentData || !currentData.meta) {
            return defaultData;
        }

        return currentData;
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
                            {getCurrentData().meta?.total || 0} file • {getTabTitle()}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => {
                                console.log('[SharedIndex] Bagikan File button clicked');
                                setShowShareModal(true);
                            }}
                            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
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
                            Dibagikan oleh Saya ({sharedByMe?.meta?.total || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('shared-with-me')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'shared-with-me'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            Dibagikan dengan Saya ({sharedWithMe?.meta?.total || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('public-links')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'public-links'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            Link Publik ({publicLinks?.meta?.total || 0})
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
                    activeTab === 'shared-by-me' ? (
                        <SharedByMeView 
                            files={getCurrentData().data as SharedFile[]}
                            viewMode={viewMode}
                            selectedFiles={selectedFiles}
                            toggleFileSelection={toggleFileSelection}
                            copyToClipboard={copyToClipboard}
                            copiedTokens={copiedTokens}
                            onManageShares={(file) => {
                                setSelectedFileForManagement(file);
                                setShowShareManagementModal(true);
                            }}
                        />
                ) : (
                    <div className={viewMode === 'grid' 
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' 
                        : 'space-y-2'
                    }>
                        {getCurrentData().data.map((share) => {
                                // Handle different data structures for different tabs
                                let file, isSelected, isExpired;
                                
                                // For other tabs (shared-with-me, public-links), we have FileShare objects
                                const fileShare = share as FileShare;
                                file = fileShare.file;
                                isSelected = selectedFiles.includes(fileShare.id);
                                isExpired = fileShare.expires_at && new Date(fileShare.expires_at) < new Date();
                            
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
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <Star className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center space-x-2">
                                                    {'permission' in share && (
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPermissionColor(share.permission)}`}>
                                                    {share.permission}
                                                </span>
                                                    )}
                                                    {'is_public_link' in share && share.is_public_link && (
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
                                                    {formatFileSize(file.size)} • {activeTab === 'shared-with-me' ? `Shared by ${'sharedBy' in share ? share.sharedBy?.name : 'Unknown'}` : `Public link`}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(share.created_at).toLocaleDateString()}
                                            </p>
                                                {'expires_at' in share && share.expires_at && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Expires {new Date(share.expires_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Quick Actions */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <div className="flex items-center space-x-2">
                                            <button 
                                                onClick={() => window.open(`/files/${file.id}/preview`, '_blank')}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Lihat file"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Unduh file"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleEditFile(file)}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Edit file"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                                {'token' in share && share.token && (
                                                <button 
                                                    onClick={() => copyToClipboard(`${window.location.origin}/public/file/${share.token}`, share.token!)}
                                                    className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                    title="Salin link"
                                                >
                                                    {copiedTokens.has(share.token) ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    setSelectedFileForManagement(file);
                                                    setShowShareManagementModal(true);
                                                }}
                                                className="rounded-full bg-white p-2 text-slate-600 hover:bg-slate-50"
                                                title="Kelola berbagi"
                                            >
                                                <Settings className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    )
                )}

                {/* Pagination */}
                {getCurrentData().meta?.last_page && getCurrentData().meta.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Menampilkan {((getCurrentData().meta?.current_page || 1) - 1) * (getCurrentData().meta?.per_page || 20) + 1} sampai {Math.min((getCurrentData().meta?.current_page || 1) * (getCurrentData().meta?.per_page || 20), getCurrentData().meta?.total || 0)} dari {getCurrentData().meta?.total || 0} hasil
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                disabled={getCurrentData().meta?.current_page === 1}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Sebelumnya
                            </button>
                            <button
                                disabled={getCurrentData().meta?.current_page === getCurrentData().meta?.last_page}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                onShare={handleShare}
                files={files}
                users={users}
                mode="file-selection"
            />

            {/* Share Management Modal */}
            <ShareManagementModal
                isOpen={showShareManagementModal}
                onClose={() => {
                    setShowShareManagementModal(false);
                    setSelectedFileForManagement(null);
                }}
                file={selectedFileForManagement}
            />

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
        </AppLayout>
    );
}
