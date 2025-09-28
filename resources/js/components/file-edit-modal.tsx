import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { File, Image, Video, Music, FileText, FileSpreadsheet, Presentation, Archive } from 'lucide-react';

interface File {
    id: number;
    name: string;
    description?: string;
    tags?: string[];
    visibility: 'private' | 'shared' | 'public';
    mime_type: string;
    size: number;
}

interface FileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
}

export default function FileEditModal({ isOpen, onClose, file }: FileEditModalProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        tags: '',
        visibility: 'private' as 'private' | 'shared' | 'public',
    });

    useEffect(() => {
        if (file) {
            setData({
                name: file.name,
                description: file.description || '',
                tags: file.tags ? file.tags.join(', ') : '',
                visibility: file.visibility,
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <File className="h-5 w-5" />
                        Sunting File
                    </DialogTitle>
                    <DialogDescription>
                        Perbarui informasi file dan pengaturan visibilitas
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* File Info */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)} • {file.mime_type}
                            </div>
                        </div>
                    </div>

                    {/* File Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama File</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Masukkan nama file"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Masukkan deskripsi file (opsional)"
                            rows={3}
                            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.description ? 'border-red-500' : ''}`}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description}</p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tag</Label>
                        <Input
                            id="tags"
                            value={data.tags}
                            onChange={(e) => setData('tags', e.target.value)}
                            placeholder="Masukkan tag dipisahkan dengan koma"
                            className={errors.tags ? 'border-red-500' : ''}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Pisahkan beberapa tag dengan koma
                        </p>
                        {errors.tags && (
                            <p className="text-sm text-red-500">{errors.tags}</p>
                        )}
                    </div>

                    {/* Visibility */}
                    <div className="space-y-2">
                        <Label htmlFor="visibility">Visibilitas</Label>
                        <Select
                            value={data.visibility}
                            onValueChange={(value: 'private' | 'shared' | 'public') => setData('visibility', value)}
                        >
                            <SelectTrigger className={errors.visibility ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Pilih visibilitas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">
                                    <div className="flex flex-col">
                                        <span className="font-medium">Pribadi</span>
                                        <span className="text-xs text-gray-500">Hanya Anda yang dapat melihat file ini</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="shared">
                                    <div className="flex flex-col">
                                        <span className="font-medium">Dibagikan</span>
                                        <span className="text-xs text-gray-500">Hanya orang yang Anda bagikan yang dapat melihat file ini</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="public">
                                    <div className="flex flex-col">
                                        <span className="font-medium">Publik</span>
                                        <span className="text-xs text-gray-500">Semua orang dapat melihat file ini</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.visibility && (
                            <p className="text-sm text-red-500">{errors.visibility}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {processing ? 'Memperbarui...' : 'Perbarui File'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

