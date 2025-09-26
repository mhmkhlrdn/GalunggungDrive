import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { 
    HardDrive, 
    FileText, 
    Folder, 
    Upload, 
    Download, 
    Trash2, 
    TrendingUp,
    TrendingDown,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Users,
    Share2
} from 'lucide-react';
import { useState } from 'react';

interface StorageStats {
    totalSpace: number;
    usedSpace: number;
    availableSpace: number;
    totalFiles: number;
    totalFolders: number;
    sharedFiles: number;
    recentUploads: number;
    monthlyGrowth: number;
}

interface FileTypeStats {
    type: string;
    count: number;
    size: number;
    percentage: number;
    color: string;
}

interface Props {
    stats: StorageStats;
    fileTypeStats: FileTypeStats[];
    recentActivity: Array<{
        id: number;
        action: string;
        file_name: string;
        size: string;
        timestamp: string;
    }>;
    locations?: Array<{
        id: number;
        name: string;
        key: string;
        driver: string;
        root: string | null;
        total: number | null;
        free: number | null;
        available: number | null;
    }>;
}

export default function StorageIndex({ stats, fileTypeStats, recentActivity, locations = [] }: Props) {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getUsagePercentage = () => {
        return (stats.usedSpace / stats.totalSpace) * 100;
    };

    const getUsageColor = (percentage: number) => {
        if (percentage < 50) return 'text-green-600';
        if (percentage < 80) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getUsageBarColor = (percentage: number) => {
        if (percentage < 50) return 'bg-green-500';
        if (percentage < 80) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Storage Management', href: '/storage' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Storage Management" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Storage Management
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            Monitor your storage usage and file statistics
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="1y">Last year</option>
                        </select>
                    </div>
                </div>

                {/* Storage Overview */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Storage Card */}
                    <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Storage Usage
                            </h3>
                            <div className="flex items-center space-x-2">
                                <HardDrive className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    {formatBytes(stats.usedSpace)} of {formatBytes(stats.totalSpace)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Used Space
                                </span>
                                <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage())}`}>
                                    {getUsagePercentage().toFixed(1)}%
                                </span>
                            </div>
                            
                            <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                    className={`h-3 rounded-full ${getUsageBarColor(getUsagePercentage())}`}
                                    style={{ width: `${getUsagePercentage()}%` }}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatBytes(stats.usedSpace)}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">Used</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatBytes(stats.availableSpace)}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">Available</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-4">
                        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Files</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stats.totalFiles.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                                    <Folder className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Folders</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stats.totalFolders.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                    <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Shared Files</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stats.sharedFiles.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Type Breakdown */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            File Types
                        </h3>
                        <div className="space-y-3">
                            {fileTypeStats.map((fileType, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div 
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: fileType.color }}
                                        />
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            {fileType.type}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {fileType.count.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatBytes(fileType.size)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center space-x-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                                        <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {activity.action} {activity.file_name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {activity.size} • {new Date(activity.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Storage Alerts */}
                {getUsagePercentage() > 80 && (
                    <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-6 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                    Storage Warning
                                </h4>
                                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                    You're using {getUsagePercentage().toFixed(1)}% of your storage. Consider cleaning up old files or upgrading your plan.
                                </p>
                                <div className="mt-3 flex space-x-3">
                                    <button className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700">
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        Clean Up
                                    </button>
                                    <button className="inline-flex items-center rounded-md border border-yellow-300 bg-white px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:bg-slate-800 dark:text-yellow-300 dark:hover:bg-slate-700">
                                        Upgrade Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin: Storage Locations (disk space) */}
                {locations.length > 0 && (
                    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Storage Locations
                        </h3>
                        <div className="space-y-3">
                            {locations.map((loc) => (
                                <div key={loc.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {loc.name} <span className="text-xs text-slate-500">({loc.key})</span>
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Driver: {loc.driver}{loc.root ? ` • Root: ${loc.root}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {loc.total !== null && loc.free !== null ? (
                                            <>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    Free: {formatBytes(loc.free)} / Total: {formatBytes(loc.total)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Not available</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Storage Tips */}
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-6 dark:bg-blue-900/20 dark:border-blue-800">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                        Storage Optimization Tips
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Delete duplicate files
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Remove duplicate files to free up space
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Archive old files
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Move old files to archive folders
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Compress large files
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Compress large files to save space
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}


