import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import FileUploadModal from '@/components/file-upload-modal';
import CreateFolderModal from '@/components/create-folder-modal';
import FilePreviewModal from '@/components/file-preview-modal';
import {
    Cloud,
    Folder,
    FileText,
    Upload,
    Download,
    Share2,
    Users,
    Activity,
    HardDrive,
    TrendingUp,
    Clock,
    Star,
    Search,
    Filter,
    Grid3X3,
    List,
    Plus,
    MoreHorizontal,
    File,
    FileSpreadsheet,
    Image,
    Video,
    Music,
    Archive,
    Folder as FileFolderIcon
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    stats: {
        totalFiles: number;
        totalFolders: number;
        storageUsed: string;
        storageLimit: string;
        recentActivity: number;
        sharedFiles: number;
    };
    recentFiles: Array<{
        id: number;
        name: string;
        type: string;
        size: string;
        modified: string;
        starred: boolean;
        folder_id?: number | null;
        uploader: {
            id: number;
            name: string;
            email: string;
        };
    }>;
    recentFolders: Array<{
        id: number;
        name: string;
        files: number;
        modified: string;
        link?: string;
    }>;
    disks?: Array<{ key: string; label: string }>;
}

export default function Dashboard({ stats, recentFiles, recentFolders, disks = [] }: DashboardProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [selectedFile, setSelectedFile] = useState<any>(null);

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <File className="h-4 w-4" />;
            case 'docx': return <FileText className="h-4 w-4" />;
            case 'xlsx': return <FileSpreadsheet className="h-4 w-4" />;
            case 'image': return <Image className="h-4 w-4" />;
            case 'video': return <Video className="h-4 w-4" />;
            case 'audio': return <Music className="h-4 w-4" />;
            case 'archive': return <Archive className="h-4 w-4" />;
            case 'folder': return <FileFolderIcon className="h-4 w-4" />;
            default: return <File className="h-4 w-4" />;
        }
    };

    const handleFileUpload = (files: globalThis.File[]) => {
        router.reload();
    };

    const handleFolderCreate = (name: string) => {
        router.reload();
    };

    const handleFilePreview = (file: any) => {
        setSelectedFile(file);
        setShowFilePreview(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Selamat datang kembali!
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            Berikut adalah aktivitas file internal perusahaan hari ini.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload File
                        </button>
                        <button
                            onClick={() => setShowCreateFolderModal(true)}
                            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Folder Baru
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <div className="flex items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total File</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalFiles.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <div className="flex items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/20">
                                <Folder className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Folder</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalFolders}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <div className="flex items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/20">
                                <HardDrive className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Penyimpanan Terpakai</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.storageUsed}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">dari {stats.storageLimit}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <div className="flex items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/20">
                                <Share2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">File Dibagikan</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.sharedFiles}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari file dan folder..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
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

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Files */}
                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">File Terbaru</h3>
                            <Link href="/files" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                Lihat semua
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentFiles.map((file) => (
                                <div key={file.id} className="flex items-center space-x-3 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
                                    <div className="text-2xl">{getFileIcon(file.type)}</div>
                                    <button 
                                        onClick={() => handleFilePreview(file)}
                                        className="flex-1 min-w-0 text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                {file.name}
                                            </p>
                                            {file.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {file.size} • {file.modified}
                                        </p>
                                    </button>
                                    <button
                                        onClick={() => window.open(`/files/${file.id}/download`, '_blank')}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity"
                                        title="Download file"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Folders */}
                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Folder Terbaru</h3>
                            <Link href="/folders" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                Lihat semua
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentFolders.map((folder) => (
                                <div key={folder.id} className="flex items-center space-x-3 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm">
                                        <FileFolderIcon className="h-4 w-4" />
                                    </div>
                                    <Link href={folder.link ?? `/folders/${folder.id}`} className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {folder.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {folder.files} files • {folder.modified}
                                        </p>
                                    </Link>
                                    <button
                                        onClick={() => window.open(`/folders/${folder.id}/download`, '_blank')}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity"
                                        title="Download folder as ZIP"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Aksi Cepat</h3>
                            <p className="text-blue-100">Mulai dengan tugas-tugas umum ini</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link href="/files" className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                                <Upload className="mr-2 h-4 w-4 inline" />
                                Upload
                            </Link>
                            <Link href="/shared" className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                                <Share2 className="mr-2 h-4 w-4 inline" />
                                Bagikan
                            </Link>
                            <Link href="/activity" className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                                <Activity className="mr-2 h-4 w-4 inline" />
                                Aktivitas
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <FileUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUpload={handleFileUpload}
                    disks={disks}
                />
                <CreateFolderModal
                    isOpen={showCreateFolderModal}
                    onClose={() => setShowCreateFolderModal(false)}
                    onCreate={handleFolderCreate}
                />
                <FilePreviewModal
                    isOpen={showFilePreview}
                    onClose={() => {
                        setShowFilePreview(false);
                        setSelectedFile(null);
                    }}
                    file={selectedFile}
                />
            </div>
        </AppLayout>
    );
}
