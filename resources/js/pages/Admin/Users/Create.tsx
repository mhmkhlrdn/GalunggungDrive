import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

export default function UserCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'guest' as 'admin' | 'staff' | 'guest',
        storage_limit: 1073741824, // 1GB default
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users');
    };

    const formatStorage = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const storageOptions = [
        { value: 1073741824, label: '1 GB' },
        { value: 5368709120, label: '5 GB' },
        { value: 10737418240, label: '10 GB' },
        { value: 53687091200, label: '50 GB' },
        { value: 107374182400, label: '100 GB' },
        { value: 536870912000, label: '500 GB' },
        { value: 1073741824000, label: '1 TB' },
    ];

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Pengguna', href: '/admin/users' },
                { title: 'Buat Baru', href: '/admin/users/create' },
            ]}
        >
            <Head title="Create User" />

            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/users">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali ke Pengguna
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tambah Pengguna</h1>
                        <p className="text-muted-foreground">
                            Tambahkan pengguna baru ke sistem
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Informasi Pengguna
                        </CardTitle>
                        <CardDescription>
                            Masukkan informasi dasar pengguna dan pengaturan akun
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Lengkap</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder="Masukkan nama lengkap"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Alamat Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={errors.email ? 'border-red-500' : ''}
                                        placeholder="Masukkan alamat email"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-500">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Kata Sandi</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={errors.password ? 'border-red-500' : ''}
                                        placeholder="Masukkan kata sandi"
                                        required
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className={errors.password_confirmation ? 'border-red-500' : ''}
                                        placeholder="Konfirmasi kata sandi"
                                        required
                                    />
                                    {errors.password_confirmation && (
                                        <p className="text-sm text-red-500">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Peran</Label>
                                    <Select
                                        value={data.role || 'guest'}
                                        onValueChange={(value) => setData('role', value as 'admin' | 'staff' | 'guest')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih peran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="guest">Tamu</SelectItem>
                                            <SelectItem value="staff">Staf</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        {data.role === 'admin' && 'Akses penuh sistem dan manajemen pengguna'}
                                        {data.role === 'staff' && 'Akses admin terbatas dan dukungan pengguna'}
                                        {data.role === 'guest' && 'Akses tamu standar ke file dan folder'}
                                    </p>
                                    {errors.role && (
                                        <p className="text-sm text-red-500">{errors.role}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="storage_limit">Batas Penyimpanan</Label>
                                    <Select
                                        value={data.storage_limit.toString()}
                                        onValueChange={(value) => setData('storage_limit', parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih batas penyimpanan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {storageOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value.toString()}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        Pilihan saat ini: {formatStorage(data.storage_limit)}
                                    </p>
                                    {errors.storage_limit && (
                                        <p className="text-sm text-red-500">{errors.storage_limit}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/admin/users">Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Membuat...' : 'Buat Pengguna'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
