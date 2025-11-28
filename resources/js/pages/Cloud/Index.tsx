import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import FilePreview from '@/components/file-preview';
import FileEditModal from '@/components/file-edit-modal';
import FilePreviewModal from '@/components/file-preview-modal';
import { FolderOpen, Download, Trash2, Search, Grid3X3, List, User, Calendar, HardDrive, Pencil, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

// User selector for sharing
interface UserOption {
    id: number;
    name: string;
    email: string;
}
import { fuzzyFilter } from '@/lib/utils';
import { useSnackbar } from '@/contexts/SnackbarContext';

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
        is_admin: boolean;
        is_super_admin: boolean;
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
    files_count?: number;
    folders_count?: number;
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
    users?: UserOption[];
}

export default function CloudIndex({ folders, files, breadcrumbs, filters = {}, users = [] }: Props) {
    const { user } = window.Auth || {};
    const isSuperAdmin = Boolean(user?.role === 'super-admin');
    const isAdmin = Boolean(user?.role === 'admin');
    const { showError, showSuccess } = useSnackbar();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState(filters.search || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order || 'desc');
    const [draggingFileId, setDraggingFileId] = useState<number | null>(null);
    const [hoverFolderId, setHoverFolderId] = useState<number | null>(null);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [previewIndex, setPreviewIndex] = useState<number>(0);
    const [showEditModal, setShowEditModal] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<{
        id: number;
        name: string;
        mime_type: string;
        size: number;
        description?: string;
        tags?: string[];
        visibility: 'private' | 'shared' | 'public';
    } | null>(null);

    // Rename folder state
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [folderToRename, setFolderToRename] = useState<{ id: number; name: string; visibility?: 'private' | 'shared' | 'public' } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [visibilityValue, setVisibilityValue] = useState<'private' | 'shared' | 'public' | ''>('private');
    const [visibilityWarning, setVisibilityWarning] = useState('');
    // For shared visibility
    const [sharedWith, setSharedWith] = useState<number[]>([]);

    // Client-side fuzzy filtering for folders and files
    const filteredFolders = fuzzyFilter(
        folders,
        search,
        (folder) => folder.name,
        0.2
    );

    // Filter current page only to keep client work minimal
    const filteredFiles = fuzzyFilter(files.data, search, (file) => `${file.name} ${file.user.name} ${file.folder?.name || ''}`, 0.2);

    const formatFileSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let i = 0;
        while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
        return `${size.toFixed(1)} ${units[i]}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs as Array<{ title: string; href: string }>}>
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
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(folder.updated_at).toLocaleDateString('id-ID')}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs">{folder.folders_count || 0} folder, {folder.files_count || 0} file</span>
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                    className="rounded bg-white p-2 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                    title="Folder actions"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/folders/${folder.id}?from=cloud`} onClick={() => { console.log('[FOLDER_ACTION] open', { folderId: folder.id, from: 'cloud/index', href: `/folders/${folder.id}?from=cloud` }); }}>
                                                        Buka
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { console.log('[FOLDER_ACTION] rename_click', { folderId: folder.id, from: 'cloud/index' }); e.preventDefault(); e.stopPropagation(); setFolderToRename({ id: folder.id, name: folder.name }); setRenameValue(folder.name); setShowRenameModal(true); }}>Edit</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => { console.log('[FOLDER_ACTION] download_click', { folderId: folder.id, from: 'cloud/index', url: `/folders/${folder.id}/download` }); e.preventDefault(); e.stopPropagation(); window.open(`/folders/${folder.id}/download`, '_blank'); }}>Download</DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (confirm('Are you sure you want to delete this folder? All files and subfolders within it will also be deleted.')) {
                                                        router.delete(`/folders/${folder.id}`, {
                                                            preserveScroll: true,
                                                            preserveState: false,
                                                            replace: true,
                                                            onSuccess: () => {
                                                                showSuccess('Folder deleted successfully');
                                                                router.get('/cloud', {}, { replace: true });
                                                            },
                                                            onError: (errors) => {
                                                                console.error('[FOLDER_ACTION] delete_error', { folderId: folder.id, errors });
                                                                if (errors.folder) {
                                                                    showError(errors.folder);
                                                                } else {
                                                                    showError('Failed to delete folder. Please try again.');
                                                                }
                                                            },
                                                            onFinish: () => {
                                                                console.log('[FOLDER_ACTION] delete_finish', { folderId: folder.id });
                                                            }
                                                        });
                                                    }
                                                }} className="text-red-600">Hapus</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                            {filteredFiles.map((file, idx) => (
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
                                        <FilePreview
                                            file={file}
                                            size="md"
                                            lazy={true}
                                            priority={idx < 8} // Load first 8 images immediately
                                        />
                                        <div className="min-w-0 flex-1">
                                            <button
                                                onClick={() => { setPreviewIndex(idx); setShowFilePreview(true); }}
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
                                                onClick={() => {
                                                    if (!(isSuperAdmin || isAdmin || (user && user.id === file.user.id))) return;
                                                    setFileToEdit({
                                                        id: file.id,
                                                        name: file.name,
                                                        mime_type: file.mime_type,
                                                        size: file.size,
                                                        description: '',
                                                        tags: [],
                                                        visibility: file.visibility,
                                                    });
                                                    setShowEditModal(true);
                                                }}
                                                className={`rounded bg-white p-2 ${isSuperAdmin || isAdmin || (user && user.id === file.user.id) ? 'text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700' : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                                                title={isSuperAdmin || isAdmin || (user && user.id === file.user.id) ? "Edit file" : "You don't have permission to edit this file"}
                                                disabled={!(isSuperAdmin || isAdmin || (user && user.id === file.user.id))}
                                            >
                                                <Pencil className="h-4 w-4" />
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
            <FilePreviewModal
                isOpen={showFilePreview}
                onClose={() => setShowFilePreview(false)}
                loggedinUser={user}
                filesInDirectory={filteredFiles.map(f => ({
                    id: f.id,
                    name: f.name,
                    mime_type: f.mime_type,
                    size: String(f.size),
                    created_at: new Date(f.updated_at).toISOString(),
                }))}
                currentIndex={previewIndex}
            />
            {fileToEdit && (
                <FileEditModal
                    isOpen={showEditModal}
                    onClose={() => { setShowEditModal(false); setFileToEdit(null); }}
                    file={{
                        id: fileToEdit.id,
                        name: fileToEdit.name,
                        description: fileToEdit.description ?? '',
                        tags: fileToEdit.tags ?? [],
                        visibility: fileToEdit.visibility,
                        mime_type: fileToEdit.mime_type,
                        size: fileToEdit.size,
                    }}
                />
            )}
            {/* Rename Folder Modal */}
            {showRenameModal && folderToRename && (
                <Dialog open={showRenameModal} onOpenChange={(open) => { if (!open) { setShowRenameModal(false); setFolderToRename(null); setSharedWith([]); } }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Folder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-600 dark:text-slate-300">Nama</label>
                                <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 dark:text-slate-300">Visibility</label>
                                <select
                                    className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                    value={visibilityValue}
                                    onChange={e => {
                                        setVisibilityValue(e.target.value as 'private' | 'shared' | 'public');
                                        if (e.target.value !== 'shared') setSharedWith([]);
                                    }}
                                >
                                    <option value="private">Pribadi</option>
                                    <option value="shared">Dibagikan</option>
                                    <option value="public">Public</option>
                                </select>
                            </div>
                            {visibilityValue === 'shared' && (
                                <div>
                                    <label className="text-sm text-slate-600 dark:text-slate-300">Pilih pengguna untuk berbagi</label>
                                    <div className="mt-1 max-h-40 overflow-y-auto border rounded p-2 bg-slate-50 dark:bg-slate-800">
                                        {users.length === 0 ? (
                                            <div className="text-slate-400 text-sm">Tidak ada pengguna lain.</div>
                                        ) : (
                                            users.map(u => (
                                                <label key={u.id} className="flex items-center gap-2 py-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={sharedWith.includes(u.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                setSharedWith(prev => [...prev, u.id]);
                                                            } else {
                                                                setSharedWith(prev => prev.filter(id => id !== u.id));
                                                            }
                                                        }}
                                                    />
                                                    <span>{u.name} <span className="text-xs text-slate-400">({u.email})</span></span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                            {visibilityWarning && (
                                <div className="text-red-600 text-sm mb-2">{visibilityWarning}</div>
                            )}
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" onClick={() => { setShowRenameModal(false); setFolderToRename(null); setVisibilityWarning(''); setSharedWith([]); }}>Batal</Button>
                                <Button
                                    onClick={() => {
                                        if (!folderToRename || !renameValue.trim()) return;
                                        if (!visibilityValue) {
                                            setVisibilityWarning('Visibility cannot be empty.');
                                            return;
                                        }
                                        if (visibilityValue === 'shared' && sharedWith.length === 0) {
                                            setVisibilityWarning('Pilih minimal satu pengguna untuk berbagi.');
                                            return;
                                        }
                                        setVisibilityWarning('');
                                        const payload: { name: string; visibility: string; shared_with?: number[] } = { name: renameValue.trim(), visibility: visibilityValue };
                                        if (visibilityValue === 'shared') payload.shared_with = sharedWith;
                                        router.put(`/folders/${folderToRename.id}`, payload, {
                                            preserveScroll: true,
                                            onSuccess: () => { setShowRenameModal(false); setFolderToRename(null); setSharedWith([]); },
                                        });
                                    }}
                                    disabled={!renameValue.trim()}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Simpan
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}


