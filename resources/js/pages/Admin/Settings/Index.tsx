import { Head, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, Upload, Image, Globe, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';

interface Settings {
    site_name: string;
    maintenance_mode: boolean;
    logo_url?: string;
    favicon_url?: string;
}

interface Props {
    settings: Settings;
}

export default function AdminSettings({ settings }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        site_name: settings.site_name,
        maintenance_mode: settings.maintenance_mode,
        logo: null as File | null,
        favicon: null as File | null,
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url || null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(settings.favicon_url || null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings', {
            forceFormData: true,
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('logo', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('favicon', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setFaviconPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Pengaturan', href: '/admin/settings' },
            ]}
        >
            <Head title="Pengaturan Admin" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Pengaturan Admin
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Kelola pengaturan situs dan mode maintenance
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Site Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Pengaturan Situs
                            </CardTitle>
                            <CardDescription>
                                Konfigurasi dasar situs web
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="site_name">Nama Situs</Label>
                                <Input
                                    id="site_name"
                                    type="text"
                                    value={data.site_name}
                                    onChange={(e) => setData('site_name', e.target.value)}
                                    placeholder="Masukkan nama situs"
                                    className="mt-1"
                                />
                                {errors.site_name && (
                                    <p className="text-sm text-red-600 mt-1">{errors.site_name}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logo Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Logo & Favicon
                            </CardTitle>
                            <CardDescription>
                                Upload logo dan favicon untuk situs
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Logo Upload */}
                            <div>
                                <Label htmlFor="logo">Logo Situs</Label>
                                <div className="mt-2 space-y-4">
                                    {logoPreview && (
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="h-16 w-auto object-contain border rounded"
                                            />
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Preview logo baru
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="logo"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="flex-1"
                                        />
                                        <Upload className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Format yang didukung: JPEG, PNG, JPG, GIF, SVG. Maksimal 2MB.
                                    </p>
                                    {errors.logo && (
                                        <p className="text-sm text-red-600">{errors.logo}</p>
                                    )}
                                </div>
                            </div>

                            {/* Favicon Upload */}
                            <div>
                                <Label htmlFor="favicon">Favicon</Label>
                                <div className="mt-2 space-y-4">
                                    {faviconPreview && (
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={faviconPreview}
                                                alt="Favicon preview"
                                                className="h-8 w-8 object-contain border rounded"
                                            />
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Preview favicon baru
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="favicon"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFaviconChange}
                                            className="flex-1"
                                        />
                                        <Upload className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Format yang didukung: ICO, PNG, JPG, JPEG. Maksimal 512KB.
                                    </p>
                                    {errors.favicon && (
                                        <p className="text-sm text-red-600">{errors.favicon}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Maintenance Mode */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <SettingsIcon className="h-5 w-5" />
                                Mode Maintenance
                            </CardTitle>
                            <CardDescription>
                                Aktifkan mode maintenance untuk menghentikan akses pengguna
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label htmlFor="maintenance_mode">Mode Maintenance</Label>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {data.maintenance_mode
                                            ? 'Situs sedang dalam mode maintenance. Pengguna tidak dapat mengakses situs.'
                                            : 'Situs berjalan normal. Pengguna dapat mengakses semua fitur.'
                                        }
                                    </p>
                                </div>
                                <Switch
                                    id="maintenance_mode"
                                    checked={data.maintenance_mode}
                                    onCheckedChange={(checked) => setData('maintenance_mode', checked)}
                                />
                            </div>
                            {data.maintenance_mode && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠️ Mode maintenance aktif! Pengguna akan melihat halaman maintenance saat mengakses situs.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppSidebarLayout>
    );
}
