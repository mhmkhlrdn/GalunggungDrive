import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Folder, Upload, Plus, ArrowLeft, Download, Share2, Edit, Trash2, Move, Star, MoreVertical, Image, Video, Music, File, FileText, FileSpreadsheet, Presentation, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import FileUploadModal from '@/components/file-upload-modal';
import MoveFileModal from '@/components/move-file-modal';
import FileEditModal from '@/components/file-edit-modal';
import { formatFileSize, formatDate } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import CreateFolderModal from '@/components/create-folder-modal';

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
}

interface Folder {
    id: number;
    name: string;
    parent_id?: number;
    created_at: string;
    updated_at: string;
    files_count: number;
    folders_count: number;
}

interface Breadcrumb {
    id: number;
    name: string;
    link: string;
}

interface Props {
    folder: Folder;
    files: File[];
    folders: Folder[];
    breadcrumbs: Breadcrumb[];
    currentFolderId?: number;
    allFolders: Folder[];
    disks?: Array<{ key: string; label: string }>;
}

export default function FolderShow({ folder, files, folders, breadcrumbs, currentFolderId, allFolders, disks = [] }: Props) {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [fileToMove, setFileToMove] = useState<{ id: number; name: string } | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<File | null>(null);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

    const handleMoveFile = (fileId: number, fileName: string) => {
        setFileToMove({ id: fileId, name: fileName });
        setShowMoveModal(true);
    };

    const handleFileMove = (folderId: number | null) => {
        window.location.reload();
    };

    const handleEditFile = (file: File) => {
        setFileToEdit(file);
        setShowEditModal(true);
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
        if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
        if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
        if (mimeType === 'application/pdf') return <File className="h-4 w-4" />;
        if (mimeType.includes('word')) return <FileText className="h-4 w-4" />;
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4" />;
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <Presentation className="h-4 w-4" />;
        if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />;
        return <File className="h-4 w-4" />;
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
        <AppLayout breadcrumbs={breadcrumbs as any}>
            <Head title={`${folder.name} - Folders`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].link : '/folders'}
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
                        <Button variant="outline" onClick={() => setShowCreateFolderModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Folder
                        </Button>
                    </div>
                </div>

                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm">
                    <Link href="/folders" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        Semua Folder
                    </Link>
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id} className="flex items-center space-x-2">
                            <span className="text-gray-400">/</span>
                            <Link
                                href={crumb.link}
                                className={`${
                                    index === breadcrumbs.length - 1
                                        ? 'text-gray-900 dark:text-white font-medium'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
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
                                <Card key={subfolder.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-blue-600" />
                                                {subfolder.name}
                                            </CardTitle>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/folders/${subfolder.id}`}>
                                                            <Folder className="h-4 w-4 mr-2" />
                                                            Open
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Share2 className="h-4 w-4 mr-2" />
                                                        Share
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this folder and its contents?')) {
                                                                router.delete(`/folders/${subfolder.id}`);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {subfolder.files_count} files • {subfolder.folders_count} folders
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {formatDate(subfolder.created_at)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
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
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Size
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Modified
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {files.map((file) => (
                                            <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="text-2xl mr-3">{getFileIcon(file.mime_type)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {file.name}
                                                                </span>
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
                                                        <Button
                                                            onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
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
                                                            title="Move"
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
                                                                            router.delete(`/files/${file.id}`);
                                                                        }
                                                                    }}
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

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                currentFolderId={folder.id}
                currentFolderName={folder.name}
                onUpload={() => window.location.reload()}
                disks={disks}
            />

            {/* Move File Modal */}
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
        </AppLayout>
    );
}
