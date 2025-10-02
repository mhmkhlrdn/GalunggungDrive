import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';

interface StorageLocation {
    id: number;
    name: string;
    root: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ShowStorageLocationProps {
    storageLocation: StorageLocation;
    diskStats?: { total: number | null; free: number | null; available: number | null };
}

export default function ShowStorageLocation({ storageLocation, diskStats }: ShowStorageLocationProps) {
    const [isToggling, setIsToggling] = useState(false);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleToggle = () => {
        setIsToggling(true);
        router.post(`/admin/storage-locations/${storageLocation.id}/toggle`, {}, {
            onFinish: () => setIsToggling(false),
        });
    };

    const handleDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus "${storageLocation.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
            router.delete(`/admin/storage-locations/${storageLocation.id}`);
        }
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Lokasi Penyimpanan', href: '/admin/storage-locations' },
                { title: storageLocation.name, href: `/admin/storage-locations/${storageLocation.id}` },
            ]}
        >
            <Head title={storageLocation.name} />

            <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/storage-locations">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Kembali
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{storageLocation.name}</h1>
                                <p className="text-muted-foreground">
                                    Detail dan konfigurasi lokasi penyimpanan
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href={`/admin/storage-locations/${storageLocation.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Ubah
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleToggle}
                                disabled={isToggling}
                            >
                                {storageLocation.is_active ? (
                                    <>
                                        <PowerOff className="h-4 w-4 mr-2" />
                                        {isToggling ? 'Menonaktifkan...' : 'Nonaktifkan'}
                                    </>
                                ) : (
                                    <>
                                        <Power className="h-4 w-4 mr-2" />
                                        {isToggling ? 'Mengaktifkan...' : 'Aktifkan'}
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Dasar</CardTitle>
                                <CardDescription>
                                    Detail inti tentang lokasi penyimpanan ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Nama</h4>
                                    <p className="text-lg">{storageLocation.name}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                    <Badge variant={storageLocation.is_active ? 'default' : 'destructive'}>
                                        {storageLocation.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Konfigurasi</CardTitle>
                                <CardDescription>
                                    Pengaturan dan opsi lokasi penyimpanan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                {storageLocation.root && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Path Root</h4>
                                        <code className="text-sm bg-muted px-2 py-1 rounded block break-all">
                                            {storageLocation.root}
                                        </code>
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </div>

                    {diskStats && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Disk Usage</CardTitle>
                                <CardDescription>
                                    Current disk space for this location
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {diskStats.total !== null && diskStats.free !== null ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Total</span>
                                            <span>{formatBytes(diskStats.total!)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Free</span>
                                            <span>{formatBytes(diskStats.free!)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Used</span>
                                            <span>{formatBytes((diskStats.total! - diskStats.free!))}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Statistik disk tidak tersedia untuk lokasi ini.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Stempel Waktu</CardTitle>
                            <CardDescription>
                                Tanggal pembuatan dan perubahan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Dibuat</h4>
                                <p>{new Date(storageLocation.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</h4>
                                <p>{new Date(storageLocation.updated_at).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
            </div>
        </AppSidebarLayout>
    );
}
