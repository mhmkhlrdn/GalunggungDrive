import { useState, useEffect } from 'react';
import { Folder, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';

interface Folder {
    id: number;
    name: string;
    parent_id?: number;
}

interface MoveFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (folderId: number | null) => void;
    fileId: number;
    fileName: string;
    currentFolderId?: number;
    folders: Folder[];
}

export default function MoveFileModal({ 
    isOpen, 
    onClose, 
    onMove, 
    fileId, 
    fileName, 
    currentFolderId,
    folders 
}: MoveFileModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        folder_id: currentFolderId || null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(`/files/${fileId}/move`, {
            onSuccess: () => {
                onMove(data.folder_id);
                reset();
                onClose();
            },
            onError: (errors) => {
                console.error('Move file error:', errors);
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const buildFolderTree = (folders: Folder[], parentId: number | null = null, level = 0): Folder[] => {
        return folders
            .filter(folder => folder.parent_id === parentId)
            .map(folder => ({
                ...folder,
                name: '  '.repeat(level) + folder.name,
                level
            }))
            .concat(
                folders
                    .filter(folder => folder.parent_id === parentId)
                    .flatMap(folder => buildFolderTree(folders, folder.id, level + 1))
            );
    };

    const folderTree = buildFolderTree(folders);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5" />
                        Move File
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Move <strong>{fileName}</strong> to:
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                            Destination Folder
                        </label>
                        <Select 
                            value={data.folder_id === null || data.folder_id === undefined ? 'root' : data.folder_id.toString()} 
                            onValueChange={(value) => setData('folder_id', value === 'root' ? null : parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select folder (or leave in root)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="root">Root (No folder)</SelectItem>
                                {folderTree.map((folder) => (
                                    <SelectItem key={folder.id} value={folder.id.toString()}>
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.folder_id && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                {errors.folder_id}
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
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {processing ? 'Moving...' : 'Move File'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

