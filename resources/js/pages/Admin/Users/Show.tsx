import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    MoreHorizontal,
    User,
    Mail,
    Calendar,
    HardDrive,
    FileText,
    Folder,
    Crown,
    Shield,
    UserCheck,
    UserX,
    Activity,
    Clock
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'staff' | 'guest';
    is_active: boolean;
    storage_limit: number;
    storage_used: number;
    created_at: string;
    updated_at: string;
    files: Array<{
        id: number;
        name: string;
        size: number;
        mime_type: string;
        created_at: string;
    }>;
    folders: Array<{
        id: number;
        name: string;
        created_at: string;
    }>;
}

interface Props {
    user: User;
    recentFiles: Array<{
        id: number;
        name: string;
        size: number;
        mime_type: string;
        updated_at: string;
    }>;
    recentFolders: Array<{
        id: number;
        name: string;
        updated_at: string;
    }>;
}

export default function UserShow({ user, recentFiles, recentFolders }: Props) {
    const handleToggleStatus = () => {
        router.post(`/admin/users/${user.id}/toggle-status`);
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
            router.delete(`/admin/users/${user.id}`);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Crown className="h-4 w-4" />;
            case 'staff': return <Shield className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const formatStorage = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStoragePercentage = (used: number, limit: number) => {
        return Math.round((used / limit) * 100);
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType === 'application/pdf') return '📄';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        return '📄';
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Users', href: '/admin/users' },
                { title: user.name, href: `/admin/users/${user.id}` },
            ]}
        >
            <Head title={user.name} />

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/users">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali ke Pengguna
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                Aksi
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Pengguna
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-red-600"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus Pengguna
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* User Info Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Peran</CardTitle>
                            {getRoleIcon(user.role)}
                        </CardHeader>
                        <CardContent>
                            <Badge className={getRoleColor(user.role)}>
                                <div className="flex items-center space-x-1">
                                    {getRoleIcon(user.role)}
                                    <span className="capitalize">{user.role}</span>
                                </div>
                            </Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            {user.is_active ? <UserCheck className="h-4 w-4 text-green-600" /> : <UserX className="h-4 w-4 text-red-600" />}
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={user.is_active}
                                    onCheckedChange={handleToggleStatus}
                                />
                                <span className="text-sm">
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Penyimpanan Terpakai</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatStorage(user.storage_used)}</div>
                            <p className="text-xs text-muted-foreground">
                                of {formatStorage(user.storage_limit)} ({getStoragePercentage(user.storage_used, user.storage_limit)}%)
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">File & Folder</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{user.files.length}</div>
                            <p className="text-xs text-muted-foreground">
                                files, {user.folders.length} folders
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Account Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Akun</CardTitle>
                        <CardDescription>
                            Informasi dasar tentang akun pengguna ini
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Nama</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{user.name}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Email</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Dibuat</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Terakhir Diperbarui</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(user.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Files */}
                    <Card>
                        <CardHeader>
                        <CardTitle>File Terbaru</CardTitle>
                        <CardDescription>
                            File terbaru yang diunggah oleh pengguna ini
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentFiles.length > 0 ? (
                                <div className="space-y-3">
                                    {recentFiles.map((file) => (
                                        <div key={file.id} className="flex items-center space-x-3">
                                            <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatStorage(file.size)} • {new Date(file.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent files</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Folders */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Folders</CardTitle>
                            <CardDescription>
                                Latest folders created by this user
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentFolders.length > 0 ? (
                                <div className="space-y-3">
                                    {recentFolders.map((folder) => (
                                        <div key={folder.id} className="flex items-center space-x-3">
                                            <Folder className="h-5 w-5 text-blue-600" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{folder.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(folder.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent folders</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppSidebarLayout>
    );
}
