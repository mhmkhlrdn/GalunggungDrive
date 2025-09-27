import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import FileUploadModal from '@/components/file-upload-modal';
import CreateFolderModal from '@/components/create-folder-modal';
import { useEffect, useRef, useState } from 'react';
import { Upload, FolderPlus, Grid3X3, List, Search, Download, Share2, Trash2, Eye, Move, Folder, FileText } from 'lucide-react';

interface FileItem { id: number; name: string; size: string; mime_type: string; updated_at: string; folder?: { id: number; name: string } }
interface FolderItem { id: number; name: string; updated_at: string }

interface Paginated<T> { data: T[]; current_page: number; last_page: number; per_page: number; total: number }

interface Props {
  files: Paginated<FileItem>;
  folders: Paginated<FolderItem>;
  filters: { search: string; sort_by: string; sort_order: string };
}

export default function HomeIndex({ files, folders, filters }: Props) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState(filters.search || '');
  const [sortBy, setSortBy] = useState(filters.sort_by || 'updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order as any || 'desc');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [{ title: 'Home', href: '/home' }];

  // search debounce
  const searchDebounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => {
      router.get('/home', { search, sort_by: sortBy, sort_order: sortOrder }, { preserveState: true, replace: true });
    }, 300);
    return () => { if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current); };
  }, [search, sortBy, sortOrder]);

  const handleFileUpload = () => router.reload();
  const handleFolderCreate = () => router.reload();

  const toggleFile = (id: number) => setSelectedFiles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleFolder = (id: number) => setSelectedFolders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleMoveFileToFolder = (fileId: number, folderId: number) => {
    router.post(`/files/${fileId}/move`, { folder_id: folderId }, { preserveScroll: true });
  };

  // minimal drag-drop: start dragging file id; drop on folder tile
  const [dragFileId, setDragFileId] = useState<number | null>(null);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Home" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Home</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Your files and folders</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowUploadModal(true)} className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </button>
            <button onClick={() => setShowCreateFolderModal(true)} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <FolderPlus className="mr-2 h-4 w-4" /> New Folder
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-slate-600 dark:text-slate-300">Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="name">Name</option>
              <option value="updated_at">Updated</option>
              <option value="created_at">Created</option>
              <option value="size">Size</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <div className="flex rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}><Grid3X3 className="h-4 w-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'}>
          {/* Folders first */}
          {folders.data.map(folder => (
            <div key={`folder-${folder.id}`} className="group relative rounded-lg border-2 p-4 transition-all hover:shadow-lg dark:border-slate-700"
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={(e) => { e.preventDefault(); if (dragFileId) { handleMoveFileToFolder(dragFileId, folder.id); setDragFileId(null); } }}>
              <div className="flex items-start space-x-3">
                <input type="checkbox" checked={selectedFolders.includes(folder.id)} onChange={() => toggleFolder(folder.id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <div className={`flex-shrink-0 ${viewMode === 'list' ? 'mt-0' : 'mt-1'}`}>
                  <Folder className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">{folder.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Updated {new Date(folder.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Files */}
          {files.data.map(file => (
            <div key={`file-${file.id}`} className="group relative rounded-lg border-2 p-4 transition-all hover:shadow-lg dark:border-slate-700"
                 draggable onDragStart={() => setDragFileId(file.id)} onDragEnd={() => setDragFileId(null)}>
              <div className="flex items-start space-x-3">
                <input type="checkbox" checked={selectedFiles.includes(file.id)} onChange={() => toggleFile(file.id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <div className={`flex-shrink-0 ${viewMode === 'list' ? 'mt-0' : 'mt-1'}`}>
                  <FileText className="h-8 w-8 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</h3>
                    <div className="pointer-events-none absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="pointer-events-auto flex items-center space-x-2">
                        <button onClick={() => window.open(`/files/${file.id}/preview`, '_blank')} className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50" title="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => window.open(`/files/${file.id}/download`, '_blank')} className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50" title="Download"><Download className="h-4 w-4" /></button>
                        <button onClick={() => router.delete(`/files/${file.id}`)} className="rounded-full bg-white p-2 text-red-600 shadow-sm hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{file.size} • {new Date(file.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination: show if any has more than one page */}
        {(files.last_page > 1 || folders.last_page > 1) && (
          <div className="text-sm text-slate-600 dark:text-slate-300">Use search/sort to navigate combined results.</div>
        )}

        {/* Modals */}
        <FileUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUpload={handleFileUpload} />
        <CreateFolderModal isOpen={showCreateFolderModal} onClose={() => setShowCreateFolderModal(false)} onCreate={handleFolderCreate} />
      </div>
    </AppLayout>
  );
}


