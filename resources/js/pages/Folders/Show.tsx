import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Folder, Upload, Plus, ArrowLeft, Download, Share2, Edit, Trash2, Move, Star, MoreVertical, File, FileText, Eye, Calendar, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FilePreviewModal from '@/components/file-preview-modal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileUploadModal from '@/components/file-upload-modal';
import MoveFileModal from '@/components/move-file-modal';
import FileEditModal from '@/components/file-edit-modal';
import { formatFileSize, formatDate } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import CreateFolderModal from '@/components/create-folder-modal';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useInertiaOperations } from '@/hooks/use-inertia-operations';
import FilePreview from '@/components/file-preview';

interface File {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    created_at: string;
    updated_at: string;
    folder_id?: number;
    starred: boolean;
    description?: string;
    tags?: string[];
    visibility: 'private' | 'shared' | 'public';
}

interface Folder {
    id: number;
    name: string;
    parent_id?: number;
    created_at: string;
    updated_at: string;
    files_count: number;
    folders_count: number;
    visibility: 'private' | 'shared' | 'public';
}

interface Breadcrumb {
    id: number;
    name: string;
    link: string;
    title: string;
    href: string;
}

interface Props {
    folder: Folder;
    files: File[];
    folders: Folder[];
    breadcrumbs: Breadcrumb[];
    allFolders: Folder[];
    from?: string;
    storageLoc: Array<{id: number; name: string}>;
}

export default function FolderShow({ folder, files, folders, breadcrumbs, allFolders, from, storageLoc }: Props) {
    const { showError, showSuccess } = useSnackbar();
    const { post } = useInertiaOperations();
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [fileToMove, setFileToMove] = useState<{ id: number; name: string } | null>(null);
    const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<File | null>(null);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [previewIndex, setPreviewIndex] = useState<number>(0);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameValue, setRenameValue] = useState(folder.name);
    const [visibility, setVisibility] = useState<'private' | 'shared' | 'public' | ''>(folder.visibility);
    const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
    const [visibilityWarning, setVisibilityWarning] = useState('');

    const handleEmptyFolder = () => {
        if (confirm('Are you sure you want to empty this folder? All files and subfolders will be permanently deleted.')) {
            router.delete(`/folders/${folder.id}/empty`, {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess('Folder emptied successfully');
                    router.reload();
                },
                onError: (errors) => {
                    if (errors.folder) {
                        showError(errors.folder);
                    } else {
                        showError('Failed to empty folder. Please try again.');
                    }
                },
            });
        }
    };

     const handleMoveFile = (fileId: number, fileName: string) => {
         setFileToMove({ id: fileId, name: fileName });
         setShowMoveModal(true);
    };

    const toggleFileSelection = (fileId: number) => {
        setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    };

    const clearSelection = () => setSelectedFiles([]);

    const handleBulkDelete = () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Hapus ${selectedFiles.length} file terpilih?`)) return;

        post('/api/files/batch-delete', { ids: selectedFiles }, {
            successMessage: `${selectedFiles.length} file berhasil dihapus.`,
            errorMessage: 'Gagal menghapus file',
            onSuccess: () => {
                showSuccess(`${selectedFiles.length} file berhasil dihapus.`);
                clearSelection();
                router.reload();
            }
        });
    };

    const handleBulkMove = (folderId: number | null) => {
        if (selectedFiles.length === 0) return;
        post('/api/files/batch-move', { ids: selectedFiles, folder_id: folderId }, {
            successMessage: `${selectedFiles.length} file dipindahkan.`,
            errorMessage: 'Gagal memindahkan file',
            onSuccess: () => {
                showSuccess(`${selectedFiles.length} file dipindahkan.`);
                clearSelection();
                router.reload();
            }
        });
    };

    const handleFileMove = () => {
        window.location.reload();
    };

    const handleEditFile = (file: File) => {
        setFileToEdit(file);
        setShowEditModal(true);
    };



    const getFileType = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return 'Image';
        if (mimeType.startsWith('video/')) return 'Video';
        if (mimeType.startsWith('audio/')) return 'Audio';
        if (mimeType === 'application/pdf') return 'PDF';
        if (mimeType.includes('word')) return 'Word Document';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Spreadsheet';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Presentation';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'Archive';
        return 'Document';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${folder.name} - Folder`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={from === 'cloud'
                                ? '/cloud'
                                : breadcrumbs.length > 1
                                    ? breadcrumbs[breadcrumbs.length - 2].link
                                    : '/folders'}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Folder className="h-6 w-6 text-blue-600" />
                                {folder.name}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {files.length} files • {folders.length} folders
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                        </Button>
                        <Button
                            onClick={() => handleEmptyFolder()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Kosongkan Folder
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateFolderModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Folder
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 p-0" title="Folder actions">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                    setRenameValue(folder.name);
                                    setVisibility(folder.visibility);
                                    setShowRenameModal(true);
                                }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Ganti Nama
                                </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { document.dispatchEvent(new Event('app:navigation-start')); window.open(`/folders/${folder.id}/download`, '_blank'); }}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
                <Link
                    href={from === 'cloud' ? '/cloud' : '/folders'}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    {from === 'cloud' ? 'Cloud' : 'Semua Folder'}
                </Link>
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="flex items-center space-x-2">
                        <span className="text-gray-400">/</span>
                        <Link
                            href={crumb.link}
                            className={`${index === breadcrumbs.length - 1
                                    ? 'text-gray-900 dark:text-white font-medium'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            {crumb.name}
                        </Link>
                    </div>
                ))}
            </nav>

            {/* Subfolders */}
            {folders.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Folders</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {folders.map((subfolder) => (
                            <div key={subfolder.id} className="relative group">
                                <Link href={`/folders/${subfolder.id}`}>
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-blue-600" />
                                                {subfolder.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    <span>{subfolder.files_count}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FolderOpen className="h-3 w-3" />
                                                    <span>{subfolder.folders_count}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(subfolder.created_at)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                                                onClick={(e) => e.preventDefault()}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => { document.dispatchEvent(new Event('app:navigation-start')); window.open(`/folders/${subfolder.id}/download`, '_blank'); }}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Share2 className="h-4 w-4 mr-2" />
                                                Share
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setRenamingFolderId(subfolder.id);
                                                    setRenameValue(subfolder.name);
                                                    setVisibility(subfolder.visibility);
                                                    setShowRenameModal(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (confirm('Are you sure you want to delete this folder and its contents?')) {
                                                        router.delete(`/folders/${subfolder.id}` , {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                showSuccess('Folder deleted successfully');
                                                                router.reload();
                                                            },
                                                            onError: (errors) => {
                                                                if (errors.folder) {
                                                                    showError(errors.folder);
                                                                } else {
                                                                    showError('Failed to delete folder. Please try again.');
                                                                }
                                                            },
                                                        });
                                                    }
                                                } }
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

                {/* Bulk actions */}
                {selectedFiles.length > 0 && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-700">{selectedFiles.length} file dipilih</div>
                            <div className="flex items-center gap-2">
                                <Button className="bg-red-600" onClick={handleBulkDelete}><Trash2 className="h-4 w-4 mr-2"/>Hapus</Button>
                                <Button className="bg-blue-600" onClick={() => setShowBulkMoveModal(true)}><Move className="h-4 w-4 mr-2"/>Pindah</Button>
                                <Button variant="ghost" onClick={clearSelection}>Batal</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Files */}
            {files.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Files</h2>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Nama
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Jenis
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Ukuran
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Dimodifikasi
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {files.map((file) => (
                                        <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                                <input type="checkbox" checked={selectedFiles.includes(file.id)} onChange={() => toggleFileSelection(file.id)} className="mr-2" />
                                                                <FilePreview file={file} size="sm"/>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => { const idx = files.findIndex(f => f.id === file.id); if (idx >= 0) { setPreviewIndex(idx); setShowFilePreview(true); } } }
                                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate text-left"
                                                                title="Klik untuk melihat file"
                                                            >
                                                                {file.name}
                                                            </button>
                                                            {file.starred && (
                                                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                            )}
                                                        </div>
                                                        {file.description && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {file.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="secondary" className="text-xs">
                                                    {getFileType(file.mime_type)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatFileSize(file.size)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(file.updated_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-1">
                                                    {selectedFiles.length > 0 ? null : (
                                                        <>
                                                        </>
                                                    )}
                                                    <Button
                                                        onClick={() => { const idx = files.findIndex(f => f.id === file.id); if (idx >= 0) { setPreviewIndex(idx); setShowFilePreview(true); } } }
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        title="Lihat"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => { document.dispatchEvent(new Event('app:navigation-start')); window.open(`/files/${file.id}/download`, '_blank'); }}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleMoveFile(file.id, file.name)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        title="Pindah"
                                                    >
                                                        <Move className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>
                                                                <Share2 className="h-4 w-4 mr-2" />
                                                                Share
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditFile(file)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to delete this file?')) {
                                                                        document.dispatchEvent(new Event('app:navigation-start'));
                                                                        router.delete(`/files/${file.id}`);
                                                                    }
                                                                } }
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {files.length === 0 && folders.length === 0 && (
                <div className="text-center py-12">
                    <Folder className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No files or folders</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by uploading a file or creating a new folder.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <Button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateFolderModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Folder
                        </Button>
                    </div>
                </div>
            )}
        </div>
        <FilePreviewModal
            isOpen={showFilePreview}
            onClose={() => setShowFilePreview(false)}
            loggedinUser={window.Auth?.user}
            filesInDirectory={files.map(f => ({
                id: f.id,
                name: f.name,
                mime_type: f.mime_type,
                size: String(f.size),
                created_at: f.created_at,
                description: f.description,
                tags: f.tags,
            }))}
            currentIndex={previewIndex}
        />

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                currentFolderId={folder.id}
                currentFolderName={folder.name}
                onUpload={() => router.reload()}
                storageLocations={storageLoc}
            />

            {/* Move File Modal (single) */}
            {fileToMove && (
                <MoveFileModal
                    isOpen={showMoveModal}
                    onClose={() => {
                        setShowMoveModal(false);
                        setFileToMove(null);
                    }}
                    onMove={handleFileMove}
                    fileId={fileToMove.id}
                    fileName={fileToMove.name}
                    currentFolderId={folder.id}
                    folders={allFolders}
                />
            )}

            {/* Move File Modal (bulk) - reuse component UI, call handleBulkMove on submit */}
            {showBulkMoveModal && (
                <MoveFileModal
                    isOpen={showBulkMoveModal}
                    onClose={() => setShowBulkMoveModal(false)}
                    onMove={(folderId) => { handleBulkMove(folderId); setShowBulkMoveModal(false); }}
                    fileId={0}
                    fileName={`${selectedFiles.length} files`}
                    currentFolderId={folder.id}
                    folders={allFolders}
                />
            )}
            {fileToEdit && (
                <FileEditModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setFileToEdit(null);
                    }}
                    file={fileToEdit}
                />
            )}
            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onCreate={() => router.reload()}
                parentId={folder.id}
            />
        {/* Rename Folder Modal */}
    <Dialog open={showRenameModal} onOpenChange={(open) => { if (!open) setShowRenameModal(open); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Ganti Nama Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-600 dark:text-slate-300">Nama</label>
                        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-600 dark:text-slate-300">Visibilitas</label>
                        <Select value={visibility} onValueChange={(value: 'private' | 'shared' | 'public') => setVisibility(value)}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Pilih visibilitas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="shared">Shared</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {visibilityWarning && (
                        <div className="text-red-600 text-sm mb-2">{visibilityWarning}</div>
                    )}
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={() => { setShowRenameModal(false); setVisibilityWarning(''); }}>Batal</Button>
                        <Button
                            onClick={() => {
                                if (!renameValue.trim()) return;
                                if (!visibility) {
                                    setVisibilityWarning('Visibility cannot be empty.');
                                    return;
                                }
                                setVisibilityWarning('');
                                const id = renamingFolderId ?? folder.id;
                                router.put(`/folders/${id}`, { name: renameValue.trim(), visibility: visibility }, {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setShowRenameModal(false);
                                        setRenamingFolderId(null);
                                    },
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
        </AppLayout>
    );
}
