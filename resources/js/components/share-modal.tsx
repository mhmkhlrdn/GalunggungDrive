import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, User, FileText, Folder, Check, Share2, Image, Video, Music, File, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface File {
    id: number;
    name: string;
    mime_type: string;
    size: string;
    folder?: {
        id: number;
        name: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShare: (fileIds: number[], userIds: number[], permission: string, expiresAt?: string, isPublicLink?: boolean) => void;
    files?: File[];
    users?: User[];
    selectedFiles?: File[];
    mode: 'file-selection' | 'user-selection';
}

export default function ShareModal({ 
    isOpen, 
    onClose, 
    onShare, 
    files = [], 
    users = [], 
    selectedFiles = [],
    mode 
}: ShareModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [permission, setPermission] = useState<'view' | 'edit' | 'download'>('view');
    const [expiresAt, setExpiresAt] = useState('');
    const [isPublicLink, setIsPublicLink] = useState(false);
    const [step, setStep] = useState<'files' | 'users' | 'settings'>(
        mode === 'user-selection' ? 'users' : 'files'
    );
    const loadedFileIdsRef = useRef<number[]>([]);

    const loadExistingShares = useCallback(async (fileIds: number[]) => {
        try {
            const response = await fetch('/api/files/shares', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ file_ids: fileIds }),
            });
            
            if (response.ok) {
                const data = await response.json();
                // Extract unique user IDs from all shares
                const existingUserIds = [...new Set(data.shares.map((share: any) => share.shared_with))];
                setSelectedUserIds(existingUserIds);
                
                // Check if any file is public
                const hasPublicFiles = data.shares.some((share: any) => share.is_public_link);
                setIsPublicLink(hasPublicFiles);
            }
        } catch (error) {
            console.error('Error loading existing shares:', error);
        }
    }, []);

    // Effect to handle modal opening and selectedFiles changes
    useEffect(() => {
        if (isOpen && mode === 'user-selection' && selectedFiles.length > 0) {
            const fileIds = selectedFiles.map(f => f.id);
            
            // Preselect file(s) passed in
            setSelectedFileIds(fileIds);
            
            // Only load shares if we haven't loaded them for these file IDs yet
            const fileIdsString = fileIds.sort().join(',');
            const loadedFileIdsString = loadedFileIdsRef.current.sort().join(',');
            
            if (fileIdsString !== loadedFileIdsString) {
                loadExistingShares(fileIds);
                loadedFileIdsRef.current = fileIds;
            }
        }
    }, [isOpen, mode, selectedFiles, loadExistingShares]);

    // Effect to handle modal closing
    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setSelectedFileIds([]);
            setSelectedUserIds([]);
            setIsPublicLink(false);
            loadedFileIdsRef.current = [];
        }
    }, [isOpen]);


    const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.folder?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFileToggle = (fileId: number) => {
        setSelectedFileIds(prev => 
            prev.includes(fileId) 
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const handleUserToggle = (userId: number) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleNext = () => {
        if (step === 'files') {
            if (selectedFileIds.length === 0) {
                alert('Pilih setidaknya satu file');
                return;
            }
            setStep('users');
        } else if (step === 'users') {
            if (selectedUserIds.length === 0 && !isPublicLink) {
                alert('Pilih setidaknya satu pengguna atau buat link publik');
                return;
            }
            setStep('settings');
        }
    };

    const handleBack = () => {
        if (step === 'users') {
            setStep('files');
        } else if (step === 'settings') {
            setStep('users');
        }
    };

    const handleShare = () => {
        console.log('handleShare called');
        console.log('selectedFileIds:', selectedFileIds);
        console.log('selectedUserIds:', selectedUserIds);
        console.log('permission:', permission);
        console.log('expiresAt:', expiresAt);
        console.log('isPublicLink:', isPublicLink);
        
        if (selectedFileIds.length === 0) {
            alert('Pilih setidaknya satu file');
            return;
        }

        if (selectedUserIds.length === 0 && !isPublicLink) {
            alert('Pilih setidaknya satu pengguna atau buat link publik');
            return;
        }

        console.log('Calling onShare with data:', {
            selectedFileIds, 
            selectedUserIds, 
            permission, 
            expiresAt: expiresAt || undefined,
            isPublicLink
        });

        onShare(
            selectedFileIds, 
            selectedUserIds, 
            permission, 
            expiresAt || undefined,
            isPublicLink
        );
        onClose();
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
        if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
        if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
        if (mimeType === 'application/pdf') return <File className="h-4 w-4" />;
        if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />;
        return <File className="h-4 w-4" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Bagikan File
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'files' && 'Pilih file yang ingin dibagikan'}
                        {step === 'users' && 'Pilih pengguna yang akan menerima file'}
                        {step === 'settings' && 'Atur izin dan pengaturan berbagi'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-2 ${step === 'files' ? 'text-blue-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'files' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                                    1
                                </div>
                                <span className="text-sm font-medium">Pilih File</span>
                            </div>
                            <div className="w-8 h-0.5 bg-slate-200"></div>
                            <div className={`flex items-center space-x-2 ${step === 'users' ? 'text-blue-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'users' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                                    2
                                </div>
                                <span className="text-sm font-medium">Pilih Pengguna</span>
                            </div>
                            <div className="w-8 h-0.5 bg-slate-200"></div>
                            <div className={`flex items-center space-x-2 ${step === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'settings' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                                    3
                                </div>
                                <span className="text-sm font-medium">Pengaturan</span>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder={step === 'files' ? 'Cari file...' : 'Cari pengguna...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* File Selection Step */}
                    {step === 'files' && (
                        <div className="space-y-2">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedFileIds.includes(file.id)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                                    }`}
                                    onClick={() => handleFileToggle(file.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedFileIds.includes(file.id)}
                                        onChange={() => handleFileToggle(file.id)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="text-2xl">{getFileIcon(file.mime_type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {file.size} • {file.folder?.name || 'Akar'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* User Selection Step */}
                    {step === 'users' && (
                        <div className="space-y-4">
                                {/* Opsi Tautan Publik */}
                            <div className="p-4 border border-slate-200 rounded-lg dark:border-slate-700">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPublicLink}
                                        onChange={(e) => setIsPublicLink(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            Buat Link Publik
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            File dapat diakses oleh siapa saja dengan link
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* User List */}
                            {!isPublicLink && (
                                <div className="space-y-2">
                                    {filteredUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                selectedUserIds.includes(user.id)
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                                            }`}
                                            onClick={() => handleUserToggle(user.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.includes(user.id)}
                                                onChange={() => handleUserToggle(user.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                                <User className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings Step */}
                    {step === 'settings' && (
                        <div className="space-y-4">
                            {/* Permission Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                    Izin Akses
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'view', label: 'Lihat', description: 'Hanya dapat melihat file' },
                                        { value: 'edit', label: 'Edit', description: 'Dapat melihat dan mengedit file' },
                                        { value: 'download', label: 'Download', description: 'Dapat mengunduh file' }
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="permission"
                                                value={option.value}
                                                checked={permission === option.value}
                                                onChange={(e) => setPermission(e.target.value as any)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {option.label}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Expiration Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                    Tanggal Kedaluwarsa (Opsional)
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center space-x-2">
                        {step !== 'files' && (
                            <Button variant="outline" onClick={handleBack}>
                                Kembali
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        {step === 'settings' ? (
                            <Button onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Bagikan
                            </Button>
                        ) : (
                            <Button onClick={handleNext}>
                                Selanjutnya
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
