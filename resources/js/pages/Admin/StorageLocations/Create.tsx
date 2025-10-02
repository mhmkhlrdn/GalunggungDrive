import { Head, Link, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Folder, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function CreateStorageLocation() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        root: '',
        visibility: 'private' as 'private' | 'public',
        is_active: true,
    });

    const [showBrowser, setShowBrowser] = useState(false);
    const [currentPath, setCurrentPath] = useState('/');
    const [directories, setDirectories] = useState<string[]>([]);
    const [parentPath, setParentPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/storage-locations');
    };

    const loadDirs = async (path: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/admin/storage-locations/browse?path=${encodeURIComponent(path)}`);
            if (!response.ok) {
                throw new Error('Gagal memuat direktori');
            }
            const data = await response.json();
            setCurrentPath(data.path);
            setDirectories(data.directories);
            setParentPath(data.parent);
        } catch (error) {
            console.error('Error:', error);
            alert('Gagal memuat direktori');
        } finally {
            setLoading(false);
        }
    };

    const handleBrowse = () => {
        setShowBrowser(true);
        loadDirs(currentPath);
    };

    const handleSelectPath = (path: string) => {
        setData('root', path);
        setShowBrowser(false);
    };

    const handleNavigate = (path: string) => {
        loadDirs(path);
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Lokasi Penyimpanan', href: '/admin/storage-locations' },
                { title: 'Buat', href: '/admin/storage-locations/create' },
            ]}
        >
            <Head title="Buat Lokasi Penyimpanan" />

            <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/storage-locations">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Buat Lokasi Penyimpanan</h1>
                            <p className="text-muted-foreground">
                                Tambahkan lokasi penyimpanan baru ke sistem Anda
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Lokasi Penyimpanan</CardTitle>
                            <CardDescription>
                                Konfigurasi pengaturan lokasi penyimpanan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="contoh: Penyimpanan Publik"
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="root">Path Root</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="root"
                                            value={data.root}
                                            onChange={(e) => setData('root', e.target.value)}
                                            placeholder="contoh: /var/www/storage/public"
                                            className={errors.root ? 'border-destructive' : ''}
                                        />
                                        <Button type="button" variant="outline" onClick={handleBrowse}>
                                            <Folder className="h-4 w-4 mr-2" />
                                            Jelajahi
                                        </Button>
                                    </div>
                                    {errors.root && (
                                        <p className="text-sm text-destructive">{errors.root}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Path direktori root untuk penyimpanan lokal
                                    </p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="visibility">Visibilitas *</Label>
                                        <Select value={data.visibility} onValueChange={(value: 'private' | 'public') => setData('visibility', value)}>
                                            <SelectTrigger className={errors.visibility ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Pilih visibilitas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="private">Pribadi</SelectItem>
                                                <SelectItem value="public">Publik</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.visibility && (
                                            <p className="text-sm text-destructive">{errors.visibility}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <Label htmlFor="is_active">Aktif</Label>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={processing}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {processing ? 'Membuat...' : 'Buat Lokasi Penyimpanan'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/admin/storage-locations">Batal</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Directory Browser Modal */}
                    {showBrowser && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Pilih Direktori</h3>
                                    <Button variant="outline" size="sm" onClick={() => setShowBrowser(false)}>
                                        Tutup
                                    </Button>
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm text-muted-foreground mb-2">Path saat ini:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm flex-1">
                                            {currentPath}
                                        </code>
                                        <Button
                                            size="sm"
                                            onClick={() => handleSelectPath(currentPath)}
                                            className="whitespace-nowrap"
                                        >
                                            Pilih Path Ini
                                        </Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg max-h-96 overflow-y-auto">
                                    {loading ? (
                                        <div className="p-4 text-center">Memuat...</div>
                                    ) : (
                                        <div className="divide-y">
                                            {parentPath && (
                                                <button
                                                    onClick={() => handleNavigate(parentPath)}
                                                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <ChevronUp className="h-4 w-4" />
                                                    <span>.. (Parent Directory)</span>
                                                </button>
                                            )}
                                            {directories.map((dir, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleNavigate(dir)}
                                                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                >
                                                    <Folder className="h-4 w-4 text-blue-500" />
                                                    <span className="truncate">{dir}</span>
                                                </button>
                                            ))}
                                            {directories.length === 0 && !parentPath && (
                                                <div className="p-4 text-center text-muted-foreground">
                                                    Tidak ada direktori yang dapat diakses
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </AppSidebarLayout>
    );
}
