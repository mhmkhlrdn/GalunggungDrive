import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Users, Link, Calendar, Shield, Copy, Check } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface File {
    id: number;
    name: string;
    size: string;
    mime_type: string;
    created_at: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    file: File;
    users: User[];
}

export default function FileShare({ file, users }: Props) {
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        shared_with: '',
        permission: 'view',
        expires_at: '',
        is_public_link: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('files.share.store', file.id), {
            onSuccess: () => {
                reset();
            },
        });
    };

    const copyToClipboard = (text: string, token: string) => {
        navigator.clipboard.writeText(text);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const breadcrumbs = [
        { title: 'File Saya', href: route('files.index') },
        { title: file.name, href: '#' },
        { title: 'Bagikan', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Bagikan ${file.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Bagikan File
                        </h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                            Bagikan "{file.name}" dengan rekan kerja atau buat link publik
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* File Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5" />
                                Informasi File
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-slate-500">Nama File</Label>
                                <p className="text-lg font-medium text-slate-900 dark:text-white">{file.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-slate-500">Ukuran</Label>
                                <p className="text-slate-900 dark:text-white">{file.size}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-slate-500">Tipe File</Label>
                                <p className="text-slate-900 dark:text-white">{file.mime_type}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-slate-500">Tanggal Upload</Label>
                                <p className="text-slate-900 dark:text-white">{new Date(file.created_at).toLocaleDateString('id-ID')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Share Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Berbagi</CardTitle>
                            <CardDescription>
                                Pilih cara berbagi file dengan rekan kerja
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Share Type */}
                                <div className="space-y-2">
                                    <Label>Jenis Berbagi</Label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name="share_type"
                                                value="user"
                                                checked={!data.is_public_link}
                                                onChange={() => setData('is_public_link', false)}
                                                className="text-blue-600"
                                            />
                                            <span className="text-sm">Bagikan dengan pengguna</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name="share_type"
                                                value="public"
                                                checked={data.is_public_link}
                                                onChange={() => setData('is_public_link', true)}
                                                className="text-blue-600"
                                            />
                                            <span className="text-sm">Link publik</span>
                                        </label>
                                    </div>
                                </div>

                                {/* User Selection */}
                                {!data.is_public_link && (
                                    <div className="space-y-2">
                                        <Label htmlFor="shared_with">Pilih Pengguna</Label>
                                        <Select value={data.shared_with} onValueChange={(value) => setData('shared_with', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih pengguna..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name} ({user.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.shared_with && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.shared_with}</p>
                                        )}
                                    </div>
                                )}

                                {/* Permission */}
                                <div className="space-y-2">
                                    <Label htmlFor="permission">Izin Akses</Label>
                                    <Select value={data.permission} onValueChange={(value) => setData('permission', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="view">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    Lihat saja
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="edit">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    Edit
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="download">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    Download
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.permission && (
                                        <p className="text-sm text-red-600 dark:text-red-400">{errors.permission}</p>
                                    )}
                                </div>

                                {/* Expiration */}
                                <div className="space-y-2">
                                    <Label htmlFor="expires_at">Kedaluwarsa (Opsional)</Label>
                                    <Input
                                        id="expires_at"
                                        type="datetime-local"
                                        value={data.expires_at}
                                        onChange={(e) => setData('expires_at', e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Kosongkan untuk tidak ada batas waktu
                                    </p>
                                    {errors.expires_at && (
                                        <p className="text-sm text-red-600 dark:text-red-400">{errors.expires_at}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={processing || (!data.is_public_link && !data.shared_with)}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {processing ? 'Membuat...' : 'Bagikan File'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Public Link Info */}
                {data.is_public_link && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Link className="h-5 w-5" />
                                Informasi Link Publik
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                                                Peringatan Keamanan
                                            </h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                                Link publik dapat diakses oleh siapa saja yang memiliki link tersebut.
                                                Pastikan file tidak mengandung informasi sensitif.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Link akan tersedia setelah berbagi</Label>
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <Link className="h-4 w-4 text-slate-500" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                            Link akan dibuat setelah Anda mengklik "Bagikan File"
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
