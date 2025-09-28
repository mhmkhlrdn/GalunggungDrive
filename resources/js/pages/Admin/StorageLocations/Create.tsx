import { Head, Link, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateStorageLocation() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        key: '',
        driver: 'local',
        root: '',
        url: '',
        visibility: 'private' as 'private' | 'public',
        serve: true,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/storage-locations');
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Storage Locations', href: '/admin/storage-locations' },
                { title: 'Create', href: '/admin/storage-locations/create' },
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
                                <div className="grid gap-4 md:grid-cols-2">
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
                                        <Label htmlFor="key">Kunci *</Label>
                                        <Input
                                            id="key"
                                            value={data.key}
                                            onChange={(e) => setData('key', e.target.value)}
                                            placeholder="contoh: penyimpanan_publik"
                                            className={errors.key ? 'border-destructive' : ''}
                                        />
                                        {errors.key && (
                                            <p className="text-sm text-destructive">{errors.key}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="driver">Driver *</Label>
                                    <Select value={data.driver} onValueChange={(value) => setData('driver', value)}>
                                        <SelectTrigger className={errors.driver ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Pilih driver" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="local">Local</SelectItem>
                                            <SelectItem value="s3">Amazon S3</SelectItem>
                                            <SelectItem value="ftp">FTP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.driver && (
                                        <p className="text-sm text-destructive">{errors.driver}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="root">Path Root</Label>
                                    <Input
                                        id="root"
                                        value={data.root}
                                        onChange={(e) => setData('root', e.target.value)}
                                        placeholder="contoh: /var/www/storage/public"
                                        className={errors.root ? 'border-destructive' : ''}
                                    />
                                    {errors.root && (
                                        <p className="text-sm text-destructive">{errors.root}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Path direktori root untuk penyimpanan lokal
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="url">URL Publik</Label>
                                    <Input
                                        id="url"
                                        value={data.url}
                                        onChange={(e) => setData('url', e.target.value)}
                                        placeholder="contoh: https://yourapp.com/storage"
                                        className={errors.url ? 'border-destructive' : ''}
                                    />
                                    {errors.url && (
                                        <p className="text-sm text-destructive">{errors.url}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        URL publik opsional untuk mengakses file
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
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="serve"
                                            checked={data.serve}
                                            onCheckedChange={(checked) => setData('serve', checked)}
                                        />
                                        <Label htmlFor="serve">Dapat melayani file</Label>
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
            </div>
        </AppSidebarLayout>
    );
}
