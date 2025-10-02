import { Folder, ChevronRight, ChevronDown, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { useInertiaOperations } from '@/hooks/use-inertia-operations';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/messages';

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
    const { post } = useInertiaOperations();
    
    // Auto-expand the current folder's parent hierarchy
    const getParentPath = (folderId: number | undefined, folders: Folder[]): number[] => {
        if (!folderId) return [];
        const folder = folders.find(f => f.id === folderId);
        if (!folder || !folder.parent_id) return [];
        return [...getParentPath(folder.parent_id, folders), folder.parent_id];
    };

    const initialExpanded = new Set(currentFolderId ? getParentPath(currentFolderId, folders) : []);
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(initialExpanded);
    const [selectedFolder, setSelectedFolder] = useState<number | null>(currentFolderId || null);
    const [processing, setProcessing] = useState(false);

    // Debug logging
    console.log('Move modal folders:', folders);
    console.log('Current folder ID:', currentFolderId);
    console.log('Initial expanded folders:', Array.from(initialExpanded));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        
        post(`/files/${fileId}/move`, 
            { folder_id: selectedFolder },
            {
                successMessage: SUCCESS_MESSAGES.FILE_MOVED,
                errorMessage: ERROR_MESSAGES.FILE_MOVE_FAILED,
            onSuccess: () => {
                    onMove(selectedFolder);
                onClose();
                    setProcessing(false);
            },
            onError: (errors) => {
                console.error('Move file error:', errors);
                    setProcessing(false);
            },
            }
        );
    };

    const handleClose = () => {
        setSelectedFolder(currentFolderId || null);
        setExpandedFolders(new Set());
        setProcessing(false);
        onClose();
    };

    const toggleFolder = (folderId: number) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const selectFolder = (folderId: number | null) => {
        setSelectedFolder(folderId);
    };

    const expandAll = () => {
        const allFolderIds = folders.map(f => f.id);
        setExpandedFolders(new Set(allFolderIds));
    };

    const collapseAll = () => {
        setExpandedFolders(new Set());
    };

    const buildFolderTree = (folders: Folder[], parentId: number | null = null): Folder[] => {
        return folders.filter(folder => folder.parent_id === parentId);
    };

    const renderFolderTree = (foldersToRender: Folder[], level = 0): React.ReactElement[] => {
        console.log(`Rendering folders at level ${level}:`, foldersToRender.map(f => f.name));
        return foldersToRender.map(folder => {
            const hasChildren = folders.some(f => f.parent_id === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const isSelected = selectedFolder === folder.id;
            console.log(`Folder ${folder.name}: hasChildren=${hasChildren}, isExpanded=${isExpanded}`);
            
            return (
                <div key={folder.id}>
                    <div 
                        className={`flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                            isSelected ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600' : ''
                        }`}
                        style={{ paddingLeft: `${level * 20 + 8}px` }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFolder(folder.id);
                                }}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded flex-shrink-0"
                                type="button"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                )}
                            </button>
                        ) : (
                            <div className="w-5 h-5 flex-shrink-0" />
                        )}
                        <div 
                            className={`flex items-center gap-2 flex-1 ${
                                folder.id === currentFolderId 
                                    ? 'cursor-not-allowed opacity-50' 
                                    : 'cursor-pointer'
                            }`}
                            onClick={() => {
                                if (folder.id !== currentFolderId) {
                                    selectFolder(folder.id);
                                }
                            }}
                        >
                            <Folder className={`h-4 w-4 ${
                                folder.id === currentFolderId 
                                    ? 'text-gray-400' 
                                    : 'text-blue-600'
                            }`} />
                            <span className={`text-sm ${
                                folder.id === currentFolderId 
                                    ? 'text-gray-400 dark:text-gray-500' 
                                    : 'text-slate-900 dark:text-white'
                            }`}>
                                {folder.name}
                                {folder.id === currentFolderId && ' (current folder)'}
                            </span>
                        </div>
                    </div>
                    {hasChildren && isExpanded && (
                        <div>
                            {renderFolderTree(buildFolderTree(folders, folder.id), level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const rootFolders = buildFolderTree(folders);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[80vh]">
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
                        <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                                Select Destination Folder
                        </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={expandAll}
                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Expand All
                                </button>
                                <button
                                    type="button"
                                    onClick={collapseAll}
                                    className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                                >
                                    Collapse All
                                </button>
                            </div>
                        </div>
                        
                        <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-64 overflow-y-auto bg-slate-50 dark:bg-slate-800">
                            {/* Root option */}
                            <div 
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${
                                    selectedFolder === null ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600' : ''
                                }`}
                                onClick={() => selectFolder(null)}
                            >
                                <div className="w-5 h-5" />
                                <Home className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <span className="text-sm text-slate-900 dark:text-white font-medium">Root (No folder)</span>
                            </div>
                            
                            {/* Folder tree */}
                            {rootFolders.length > 0 ? (
                                renderFolderTree(rootFolders)
                            ) : (
                                <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                    No folders available
                            </div>
                        )}
                        </div>
                        
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

