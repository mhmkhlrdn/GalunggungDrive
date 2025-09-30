import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { File, Image, Video, Music, FileText, FileSpreadsheet, Presentation, Archive, Users, Lock, Globe } from 'lucide-react';

interface File {
    id: number;
    name: string;
    description?: string;
    tags?: string[];
    visibility: 'private' | 'shared' | 'public';
    mime_type: string;
    size: number;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface FileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    users?: User[];
}

export default function FileEditModal({ isOpen, onClose, file, users = [] }: FileEditModalProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        tags: '',
        visibility: 'private' as 'private' | 'shared' | 'public',
        shared_with: [] as number[],
    });

    useEffect(() => {
        if (file) {
            setData({
                name: file.name,
                description: file.description || '',
                tags: file.tags ? file.tags.join(', ') : '',
                visibility: file.visibility,
                shared_with: [],
            });
        }
    }, [file]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;


        put(`/files/${file.id}`, {
            onSuccess: () => {
                onClose();
                reset();
            },
            onError: (errors) => {
                console.error('Update file error:', errors);
            },
        });
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
        if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
        if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
        if (mimeType === 'application/pdf') return <File className="h-4 w-4" />;
        if (mimeType.includes('word')) return <FileText className="h-4 w-4" />;
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4" />;
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <Presentation className="h-4 w-4" />;
        if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />;
        return <File className="h-4 w-4" />;
    };

    const formatFileSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    if (!file) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        Sunting File
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Perbarui informasi file dan pengaturan visibilitas
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                                {getFileIcon(file.mime_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                    {file.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {formatFileSize(file.size)} • {file.mime_type}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Name */}
                    <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Nama File
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Masukkan nama file"
                            className={`h-11 ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Deskripsi
                        </Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Masukkan deskripsi file (opsional)"
                            rows={3}
                            className={`flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${errors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                        <Label htmlFor="tags" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Tag
                        </Label>
                        <Input
                            id="tags"
                            value={data.tags}
                            onChange={(e) => setData('tags', e.target.value)}
                            placeholder="Masukkan tag dipisahkan dengan koma"
                            className={`h-11 ${errors.tags ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            Pisahkan beberapa tag dengan koma
                        </p>
                        {errors.tags && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.tags}
                            </p>
                        )}
                    </div>

                    {/* Visibility */}
                    <div className="space-y-3">
                        <Label htmlFor="visibility" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Visibilitas
                        </Label>
                        <Select
                            value={data.visibility}
                            onValueChange={(value: 'private' | 'shared' | 'public') => setData('visibility', value)}
                        >
                            <SelectTrigger className={`h-11 ${errors.visibility ? 'border-red-500 focus:border-red-500' : ''}`}>
                                <SelectValue placeholder="Pilih visibilitas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">
                                    <div className="flex items-center gap-3 py-1">
                                        <Lock className="h-4 w-4 text-gray-500" />
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-gray-900 dark:text-white">Pribadi</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Hanya Anda yang dapat melihat file ini</span>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="shared">
                                    <div className="flex items-center gap-3 py-1">
                                        <Users className="h-4 w-4 text-gray-500" />
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-gray-900 dark:text-white">Dibagikan</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Hanya orang yang Anda bagikan yang dapat melihat file ini</span>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="public">
                                    <div className="flex items-center gap-3 py-1">
                                        <Globe className="h-4 w-4 text-gray-500" />
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-gray-900 dark:text-white">Publik</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Semua orang dapat melihat file ini</span>
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.visibility && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.visibility}
                            </p>
                        )}
                    </div>

                    {/* Shared Users - Only show when visibility is 'shared' */}
                    {data.visibility === 'shared' && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <Label htmlFor="shared_with" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Bagikan dengan
                            </Label>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                                    {users.map((user) => (
                                        <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-3 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={data.shared_with?.includes(user.id) || false}
                                                onChange={(e) => {
                                                    const currentSharedWith = data.shared_with || [];
                                                    if (e.target.checked) {
                                                        setData('shared_with', [...currentSharedWith, user.id]);
                                                    } else {
                                                        setData('shared_with', currentSharedWith.filter(id => id !== user.id));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {user.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {users.length === 0 && (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Tidak ada pengguna lain yang tersedia untuk dibagikan.
                                        </p>
                                    </div>
                                )}
                            </div>
                            {errors.shared_with && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                    {errors.shared_with}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                            className="h-11 px-6"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                            {processing ? 'Memperbarui...' : 'Perbarui File'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

