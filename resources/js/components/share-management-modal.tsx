import { useState, useEffect } from 'react';
import { X, User, Trash2, Edit, Download, Eye, ExternalLink, Clock } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Share {
    id: number;
    shared_with: number | object;
    shared_with_user?: {
        id: number;
        name: string;
        email: string;
    };
    sharedWith?: {
        id: number;
        name: string;
        email: string;
    };
    permission: 'view' | 'edit' | 'download';
    is_public_link: boolean;
    expires_at?: string;
    token?: string;
}

interface File {
    id: number;
    name: string;
    size: string;
    updated_at: string;
    shares: Share[];
}

interface ShareManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
}

export default function ShareManagementModal({ isOpen, onClose, file }: ShareManagementModalProps) {
    const [shares, setShares] = useState<Share[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && file) {
            setShares(file.shares || []);
        }
    }, [isOpen, file]);

    const getPermissionIcon = (permission: string) => {
        switch (permission) {
            case 'view': return <Eye className="h-4 w-4" />;
            case 'edit': return <Edit className="h-4 w-4" />;
            case 'download': return <Download className="h-4 w-4" />;
            default: return <Eye className="h-4 w-4" />;
        }
    };

    const getPermissionColor = (permission: string) => {
        switch (permission) {
            case 'view': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'edit': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            case 'download': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
        }
    };

    const getPermissionLabel = (permission: string) => {
        switch (permission) {
            case 'view': return 'Lihat';
            case 'edit': return 'Edit';
            case 'download': return 'Download';
            default: return 'Lihat';
        }
    };

    const getUserName = (share: Share) => {
        if (share.shared_with_user?.name) return share.shared_with_user.name;
        if (share.sharedWith?.name) return share.sharedWith.name;
        if (share.shared_with && typeof share.shared_with === 'object' && 'name' in share.shared_with) {
            return share.shared_with.name;
        }
        if (share.shared_with && typeof share.shared_with === 'number') {
            return `ID Pengguna: ${share.shared_with}`;
        }
        return 'Tidak Diketahui';
    };

    const handleUpdatePermission = (shareId: number, newPermission: 'view' | 'edit' | 'download') => {
        setLoading(true);
        router.put(`/file-shares/${shareId}`, {
            permission: newPermission
        }, {
            onSuccess: () => {
                setShares(prev => prev.map(share => 
                    share.id === shareId 
                        ? { ...share, permission: newPermission }
                        : share
                ));
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            }
        });
    };

    const handleDeleteShare = (shareId: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus akses ini?')) return;
        
        setLoading(true);
        router.delete(`/file-shares/${shareId}`, {
            onSuccess: () => {
                setShares(prev => prev.filter(share => share.id !== shareId));
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            }
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50" onClick={onClose} />
                
                <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-slate-800">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Kelola Berbagi
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                {file.name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {shares.length === 0 ? (
                            <div className="text-center py-8">
                                <User className="mx-auto h-12 w-12 text-slate-400" />
                                <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                                    Belum ada akses dibagikan
                                </h3>
                                <p className="mt-1 text-slate-600 dark:text-slate-400">
                                    File ini belum dibagikan dengan siapa pun.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {shares.map((share) => {
                                    const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
                                    
                                    return (
                                        <div
                                            key={share.id}
                                            className={`rounded-lg border p-4 transition-colors ${
                                                isExpired 
                                                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                                                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {share.is_public_link ? (
                                                        <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
                                                            <ExternalLink className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                                                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {share.is_public_link ? 'Link Publik' : getUserName(share)}
                                                        </p>
                                                        {share.is_public_link && share.token && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                {window.location.origin}/public/file/{share.token}
                                                            </p>
                                                        )}
                                                        {share.expires_at && (
                                                            <div className="flex items-center space-x-1 mt-1">
                                                                <Clock className="h-3 w-3 text-slate-400" />
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    Berakhir {new Date(share.expires_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {isExpired && (
                                                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                                Kedaluwarsa
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    {/* Permission Selector */}
                                                    <select
                                                        value={share.permission}
                                                        onChange={(e) => handleUpdatePermission(share.id, e.target.value as 'view' | 'edit' | 'download')}
                                                        disabled={loading}
                                                        className={`rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${
                                                            getPermissionColor(share.permission)
                                                        }`}
                                                    >
                                                        <option value="view">Lihat</option>
                                                        <option value="edit">Edit</option>
                                                        <option value="download">Download</option>
                                                    </select>

                                                    {/* Copy Link Button (for public links) */}
                                                    {share.is_public_link && share.token && (
                                                        <button
                                                            onClick={() => copyToClipboard(`${window.location.origin}/public/file/${share.token}`)}
                                                            className="rounded-md bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                                                            title="Salin link"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </button>
                                                    )}

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => handleDeleteShare(share.id)}
                                                        disabled={loading}
                                                        className="rounded-md bg-red-100 p-1 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                                                        title="Hapus akses"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 border-t border-slate-200 p-6 dark:border-slate-700">
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
