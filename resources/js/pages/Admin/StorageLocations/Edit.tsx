import { Head, Link, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';

interface StorageLocation {
    id: number;
    name: string;
    key: string;
    driver: string;
    root: string | null;
    url: string | null;
    visibility: 'private' | 'public';
    serve: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface EditStorageLocationProps {
    storageLocation: StorageLocation;
}

export default function EditStorageLocation({ storageLocation }: EditStorageLocationProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: storageLocation.name,
        key: storageLocation.key,
        driver: storageLocation.driver,
        root: storageLocation.root || '',
        url: storageLocation.url || '',
        visibility: storageLocation.visibility,
        serve: storageLocation.serve,
        is_active: storageLocation.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/storage-locations/${storageLocation.id}`);
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Lokasi Penyimpanan', href: '/admin/storage-locations' },
                { title: storageLocation.name, href: `/admin/storage-locations/${storageLocation.id}/edit` },
            ]}
        >
            <Head title={`Edit ${storageLocation.name}`} />

            <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/storage-locations">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Lokasi Penyimpanan</h1>
                            <p className="text-muted-foreground">
                                Perbarui setelan penyimpanan
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rincian Lokasi Penyimpinan</CardTitle>
                            <CardDescription>
                                Ubah pengaturan lokasi penyimpanan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g., Public Storage"
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="key">Key *</Label>
                                        <Input
                                            id="key"
                                            value={data.key}
                                            onChange={(e) => setData('key', e.target.value)}
                                            placeholder="e.g., public_storage"
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
                                            <SelectValue placeholder="Select a driver" />
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
                                    <Label htmlFor="root">Root Path</Label>
                                    <Input
                                        id="root"
                                        value={data.root}
                                        onChange={(e) => setData('root', e.target.value)}
                                        placeholder="e.g., /var/www/storage/public"
                                        className={errors.root ? 'border-destructive' : ''}
                                    />
                                    {errors.root && (
                                        <p className="text-sm text-destructive">{errors.root}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        The root directory path for local storage
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="url">Public URL</Label>
                                    <Input
                                        id="url"
                                        value={data.url}
                                        onChange={(e) => setData('url', e.target.value)}
                                        placeholder="e.g., https://yourapp.com/storage"
                                        className={errors.url ? 'border-destructive' : ''}
                                    />
                                    {errors.url && (
                                        <p className="text-sm text-destructive">{errors.url}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Optional public URL for accessing files
                                    </p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="visibility">Visibility *</Label>
                                        <Select value={data.visibility} onValueChange={(value: 'private' | 'public') => setData('visibility', value)}>
                                            <SelectTrigger className={errors.visibility ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="private">Private</SelectItem>
                                                <SelectItem value="public">Public</SelectItem>
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
                                        <Label htmlFor="serve">Can serve files</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <Label htmlFor="is_active">Active</Label>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={processing}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {processing ? 'Updating...' : 'Update Storage Location'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/admin/storage-locations">Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
            </div>
        </AppSidebarLayout>
    );
}
