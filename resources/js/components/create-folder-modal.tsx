import { useState } from 'react';
import { Folder, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { useInertiaOperations } from '@/hooks/use-inertia-operations';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/messages';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, parentId?: number) => void;
    parentId?: number;
}

export default function CreateFolderModal({ isOpen, onClose, onCreate, parentId }: CreateFolderModalProps) {
    const { post: inertiaPost } = useInertiaOperations();
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        parent_id: parentId || null,
        visibility: 'private' as 'private' | 'shared' | 'public',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!data.name.trim()) {
            return;
        }

        inertiaPost('/folders', data, {
            successMessage: SUCCESS_MESSAGES.FOLDER_CREATED,
            errorMessage: ERROR_MESSAGES.FOLDER_CREATE_FAILED,
            onSuccess: () => {
                onCreate(data.name.trim(), parentId);
                reset();
                onClose();
            },
            onError: (errors) => {
                console.error('Create folder error:', errors);
            }
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5" />
                        Buat Folder Baru
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="folderName">Nama Folder</Label>
                        <Input
                            id="folderName"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Masukkan nama folder"
                            autoFocus
                            disabled={processing}
                        />
                        {errors.name && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                {errors.name}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="folderVisibility">Visibilitas</Label>
                        <Select value={data.visibility} onValueChange={(v) => setData('visibility', v as 'private' | 'shared' | 'public')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih visibilitas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="shared">Shared</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.visibility && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                {errors.visibility}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={!data.name.trim() || processing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {processing ? 'Membuat...' : 'Buat Folder'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
