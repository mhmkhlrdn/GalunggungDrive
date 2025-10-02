import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Shield,
    User,
    UserCheck,
    Calendar,
    HardDrive,
    FileText,
    Folder,
    Mail,
    Crown,
    UserX
} from 'lucide-react';
import { useState } from 'react';

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
    files_count: number;
    folders_count: number;
}

interface Stats {
    totalUsers: number;
    adminUsers: number;
    staffUsers: number;
    regularUsers: number;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: {
        search: string;
        role: string;
        sort_by: string;
        sort_order: string;
    };
}

export default function UsersIndex({ users, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || 'all');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');

    const handleSearch = () => {
        router.get('/admin/users', {
            search,
            role: role === 'all' ? '' : role,
            sort_by: sortBy,
            sort_order: sortOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSort = (field: string) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);
        router.get('/admin/users', {
            search,
            role: role === 'all' ? '' : role,
            sort_by: field,
            sort_order: newOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleToggleStatus = (userId: number) => {
        router.post(`/admin/users/${userId}/toggle-status`);
    };

    const handleDelete = (userId: number, userName: string) => {
        if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            router.delete(`/admin/users/${userId}`);
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

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Pengguna', href: '/admin/users' },
            ]}
        >
            <Head title="User Management" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
                        <p className="text-muted-foreground">
                            Kelola pengguna, peran, dan izin
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/users/create">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Tambah Pengguna
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Admin</CardTitle>
                            <Crown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.adminUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Staf</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.staffUsers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pengguna Biasa</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.regularUsers}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <Label htmlFor="search">Cari</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Cari pengguna..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="sm:w-48">
                                <Label htmlFor="role">Peran</Label>
                                <Select value={role || "all"} onValueChange={(value) => setRole(value === "all" ? "" : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua peran</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="staff">Staf</SelectItem>
                                        <SelectItem value="guest">Tamu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleSearch}>
                                <Filter className="h-4 w-4 mr-2" />
                                Terapkan Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pengguna</CardTitle>
                        <CardDescription>
                            Kelola semua pengguna dalam sistem
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('name')}
                                        >
                                            Pengguna
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('role')}
                                        >
                                            Peran
                                        </TableHead>
                                        <TableHead>Penyimpanan</TableHead>
                                        <TableHead>File</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('created_at')}
                                        >
                                            Dibuat
                                        </TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getRoleColor(user.role)}>
                                                    <div className="flex items-center space-x-1">
                                                        {getRoleIcon(user.role)}
                                                        <span className="capitalize">{user.role}</span>
                                                    </div>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-sm">
                                                        {formatStorage(user.storage_used)} / {formatStorage(user.storage_limit)}
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full"
                                                            style={{ width: `${getStoragePercentage(user.storage_used, user.storage_limit)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center space-x-1">
                                                        <FileText className="h-3 w-3" />
                                                        <span>{user.files_count}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Folder className="h-3 w-3" />
                                                        <span>{user.folders_count}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={user.is_active}
                                                        onCheckedChange={() => handleToggleStatus(user.id)}
                                                    />
                                                    <span className="text-sm">
                                                        {user.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/users/${user.id}`}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Lihat
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/users/${user.id}/edit`}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(user.id, user.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {((users.current_page - 1) * users.per_page) + 1} sampai {Math.min(users.current_page * users.per_page, users.total)} dari {users.total} pengguna
                                </div>
                                <div className="flex items-center space-x-2">
                                    {users.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get('/admin/users', { ...filters, page: users.current_page - 1 })}
                                        >
                                            Sebelumnya
                                        </Button>
                                    )}
                                    {users.current_page < users.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.get('/admin/users', { ...filters, page: users.current_page + 1 })}
                                        >
                                            Selanjutnya
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
