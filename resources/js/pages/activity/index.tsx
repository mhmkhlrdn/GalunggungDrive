import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Search,
    Filter,
    Calendar,
    Clock,
    User,
    Activity,
    Upload,
    Download,
    Share2,
    Trash2,
    RotateCcw,
    FolderPlus,
    LogIn,
    FileText,
    Folder,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

interface ActivityLog {
    id: number;
    action: 'upload' | 'download' | 'share' | 'delete' | 'restore' | 'create_folder' | 'login';
    target_type: 'file' | 'folder' | 'user';
    target_id: number;
    ip_address: string;
    user_agent: string;
    success: boolean;
    details: Record<string, any>;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface Props {
    activities: {
        data: ActivityLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    availableActions: string[];
    filters: {
        search: string;
        action: string;
        date_from: string;
        date_to: string;
    };
}

export default function ActivityIndex({ activities, availableActions, filters }: Props) {
    const [selectedActivities, setSelectedActivities] = useState<number[]>([]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'upload': return Upload;
            case 'download': return Download;
            case 'share': return Share2;
            case 'delete': return Trash2;
            case 'restore': return RotateCcw;
            case 'create_folder': return FolderPlus;
            case 'login': return LogIn;
            default: return Activity;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'upload': return 'text-green-600';
            case 'download': return 'text-blue-600';
            case 'share': return 'text-purple-600';
            case 'delete': return 'text-red-600';
            case 'restore': return 'text-yellow-600';
            case 'create_folder': return 'text-indigo-600';
            case 'login': return 'text-gray-600';
            default: return 'text-slate-600';
        }
    };

    const getTargetIcon = (targetType: string) => {
        switch (targetType) {
            case 'file': return FileText;
            case 'folder': return Folder;
            case 'user': return User;
            default: return Activity;
        }
    };

    const getSuccessIcon = (success: boolean) => {
        return success ? CheckCircle : XCircle;
    };

    const getSuccessColor = (success: boolean) => {
        return success ? 'text-green-600' : 'text-red-600';
    };

    const getActionName = (action: string) => {
        const actionNames: Record<string, string> = {
            'upload': 'Unggah',
            'download': 'Unduh',
            'share': 'Bagikan',
            'delete': 'Hapus',
            'restore': 'Pulihkan',
            'create_folder': 'Buat Folder',
            'login': 'Masuk',
            'preview': 'Pratinjau',
            'edit': 'Edit',
            'move': 'Pindahkan',
            'copy': 'Salin',
            'rename': 'Ubah Nama'
        };
        return actionNames[action] || action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getTargetTypeName = (targetType: string) => {
        const targetTypeNames: Record<string, string> = {
            'file': 'File',
            'folder': 'Folder',
            'user': 'Pengguna'
        };
        return targetTypeNames[targetType] || targetType;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;
        return date.toLocaleDateString();
    };

    const toggleActivitySelection = (activityId: number) => {
        setSelectedActivities(prev =>
            prev.includes(activityId)
                ? prev.filter(id => id !== activityId)
                : [...prev, activityId]
        );
    };


    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Log Aktivitas', href: '/activity' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Log Aktivitas" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Log Aktivitas
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {activities.total} aktivitas • Pantau semua aktivitas file dan sistem
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                            <Calendar className="mr-2 h-4 w-4" />
                            Ekspor
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Pencarian
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari aktivitas..."
                                    defaultValue={filters.search}
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Aksi
                            </label>
                            <select
                                defaultValue={filters.action}
                                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="">Semua Aksi</option>
                                {availableActions.map((action) => (
                                    <option key={action} value={action}>
                                        {getActionName(action)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                defaultValue={filters.date_from}
                                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Tanggal Akhir
                            </label>
                            <input
                                type="date"
                                defaultValue={filters.date_to}
                                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                <Filter className="mr-2 h-4 w-4" />
                                Terapkan Filter
                            </button>
                            <button className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                                Hapus
                            </button>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            {activities.total} total aktivitas
                        </div>
                    </div>
                </div>

                {/* Activities List */}
                {activities.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                            <Activity className="h-12 w-12 text-slate-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">Tidak ada aktivitas ditemukan</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            Aktivitas akan muncul di sini saat Anda menggunakan sistem.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.data.map((activity) => {
                            const ActionIcon = getActionIcon(activity.action);
                            const TargetIcon = getTargetIcon(activity.target_type);
                            const SuccessIcon = getSuccessIcon(activity.success);
                            const isSelected = selectedActivities.includes(activity.id);

                            return (
                                <div
                                    key={activity.id}
                                    className={`rounded-lg border p-4 transition-all hover:shadow-md dark:border-slate-700 ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 bg-white dark:bg-slate-800'
                                    }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleActivitySelection(activity.id)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="flex-shrink-0">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                                activity.success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                                            }`}>
                                                <ActionIcon className={`h-5 w-5 ${getActionColor(activity.action)}`} />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {getActionName(activity.action)}
                                                    </h3>
                                                    <div className="flex items-center space-x-1">
                                                        <TargetIcon className="h-4 w-4 text-slate-400" />
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {getTargetTypeName(activity.target_type)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <SuccessIcon className={`h-4 w-4 ${getSuccessColor(activity.success)}`} />
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {formatDate(activity.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center">
                                                    <User className="mr-1 h-3 w-3" />
                                                    {activity.user?.name || 'Unknown User'}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {new Date(activity.created_at).toLocaleString('id-ID')}
                                                </span>
                                                <span className="flex items-center">
                                                    <Activity className="mr-1 h-3 w-3" />
                                                    {activity.ip_address}
                                                </span>
                                            </div>
                                            {activity.details && Object.keys(activity.details).length > 0 && (
                                                <div className="mt-2 rounded bg-slate-50 p-2 dark:bg-slate-700/50">
                                                    <div className="text-xs text-slate-600 dark:text-slate-300">
                                                        {Object.entries(activity.details).map(([key, value]) => (
                                                            <div key={key} className="flex justify-between">
                                                                <span className="font-medium">{key.replace('_', ' ')}:</span>
                                                                <span>{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {activities.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Menampilkan {((activities.current_page - 1) * activities.per_page) + 1} sampai {Math.min(activities.current_page * activities.per_page, activities.total)} dari {activities.total} hasil
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                disabled={activities.current_page === 1}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Sebelumnya
                            </button>
                            <button
                                disabled={activities.current_page === activities.last_page}
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
