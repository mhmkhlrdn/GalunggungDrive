import { Head, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, Settings as SettingsIcon } from 'lucide-react';

interface Settings {
    maintenance_mode: boolean;
}

interface Props {
    settings: Settings;
}

export default function AdminSettings({ settings }: Props) {
    const { data, setData, post, processing } = useForm({
        maintenance_mode: settings.maintenance_mode,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings');
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
