import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { 
    Home, 
    Folder, 
    FileText, 
    Share2, 
    Activity, 
    Settings,
    HardDrive,
    Star,
    Clock,
    Trash2,
    Upload,
    FolderPlus,
    Users,
    Shield,
    History,
    Download,
    Eye,
    Edit,
    Archive,
    Search,
    Filter,
    MoreHorizontal,
    ChevronRight,
    ChevronDown,
    Plus,
    FileUp,
    FolderOpen,
    Globe,
    Lock,
    Unlock,
    UserCheck,
    Link as LinkIcon,
    Calendar,
    BarChart3,
    Database,
    Server,
    Zap,
    Cloud,
    Sparkles,
    Layers,
    Grid3X3,
    TrendingUp,
    FolderTree,
    FileImage,
    FileType,
    Archive as ArchiveIcon,
    Crown,
    Rocket,
    Folder as FileFolderIcon,
    Handshake,
    Zap as ZapIcon,
    Cog,
    Crown as CrownIcon
} from 'lucide-react';
import { useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage<SharedData>();
    const [expandedItems, setExpandedItems] = useState<string[]>(['files', 'sharing', 'management']);
    const isAdmin = page.props.auth.user.role === 'admin';
    
    const toggleExpanded = (itemId: string) => {
        setExpandedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const defaultItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: Home,
        },
        {
            title: 'File Saya',
            href: '/files',
            icon: FileText,
        },
        {
            title: 'Folder',
            href: '/folders',
            icon: Folder,
        },
        {
            title: 'Dibagikan',
            href: '/shared',
            icon: Share2,
        },
        {
            title: 'Terbaru',
            href: '/recent',
            icon: Clock,
        },
        {
            title: 'Favorit',
            href: '/starred',
            icon: Star,
        },
        {
            title: 'Penyimpanan',
            href: '/storage',
            icon: HardDrive,
        },
        {
            title: 'Cloud',
            href: '/cloud',
            icon: Globe,
        },
        {
            title: 'Aktivitas',
            href: '/activity',
            icon: Activity,
        },
        {
            title: 'Sampah',
            href: '/trash',
            icon: Trash2,
        },
    ];

    const navItems = items.length > 0 ? items : defaultItems;

    return (
        <div className="space-y-4">
            {/* Quick Actions - Prominent at top */}
            <div className="px-2 py-2">
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <Link
                        href="/files?action=upload"
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative">
                            <Upload className="h-5 w-5 mb-1" />
                            <div className="text-xs font-semibold">Upload</div>
                        </div>
                    </Link>
                    <Link
                        href="/folders?action=create"
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative">
                            <FolderPlus className="h-5 w-5 mb-1" />
                            <div className="text-xs font-semibold">New Folder</div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Dashboard - Hero Section */}
            <SidebarGroup className="px-2 py-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url === '/dashboard'}
                            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <Link href="/dashboard" prefetch>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                                        <Grid3X3 className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">Dashboard</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* File Management */}
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileFolderIcon className="h-3 w-3" />
                    File Management
                </SidebarGroupLabel>
                <SidebarMenu className="space-y-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => toggleExpanded('files')}
                            className="w-full justify-between group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-lg transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                                <FileText className="h-4 w-4" />
                                </div>
                                <span className="font-medium">File Saya</span>
                            </div>
                            {expandedItems.includes('files') ? (
                                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200" />
                            )}
                        </SidebarMenuButton>
                        {expandedItems.includes('files') && (
                            <SidebarMenuSub className="ml-4 mt-2 space-y-1">
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/files" prefetch>
                                            <FolderTree className="h-4 w-4 text-blue-500" />
                                            <span>Semua File</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/files?type=images" prefetch>
                                            <FileImage className="h-4 w-4 text-emerald-500" />
                                            <span>Gambar</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/files?type=documents" prefetch>
                                            <FileType className="h-4 w-4 text-orange-500" />
                                            <span>Dokumen</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/files?type=archives" prefetch>
                                            <ArchiveIcon className="h-4 w-4 text-purple-500" />
                                            <span>Arsip</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith('/folders')}
                            className="group hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 rounded-lg transition-all duration-200"
                        >
                            <Link href="/folders" prefetch>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm">
                                <Folder className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Folder</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith('/cloud')}
                            className="group hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-900/20 dark:hover:to-blue-900/20 rounded-lg transition-all duration-200"
                        >
                            <Link href="/cloud" prefetch>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                                        <Cloud className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Cloud</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* Sharing & Collaboration */}
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Handshake className="h-3 w-3" />
                    Sharing & Collaboration
                </SidebarGroupLabel>
                <SidebarMenu className="space-y-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => toggleExpanded('sharing')}
                            className="w-full justify-between group hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 rounded-lg transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-sm">
                                <Share2 className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Dibagikan</span>
                            </div>
                            {expandedItems.includes('sharing') ? (
                                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200" />
                            )}
                        </SidebarMenuButton>
                        {expandedItems.includes('sharing') && (
                            <SidebarMenuSub className="ml-4 mt-2 space-y-1">
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/shared" prefetch>
                                            <Layers className="h-4 w-4 text-orange-500" />
                                            <span>Semua Berbagi</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/shared?tab=shared-by-me" prefetch>
                                            <UserCheck className="h-4 w-4 text-green-500" />
                                            <span>Dibagikan oleh Saya</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/shared?tab=shared-with-me" prefetch>
                                            <Users className="h-4 w-4 text-blue-500" />
                                            <span>Dibagikan dengan Saya</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/shared?tab=public-links" prefetch>
                                            <Globe className="h-4 w-4 text-purple-500" />
                                            <span>Link Publik</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* Quick Access */}
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ZapIcon className="h-3 w-3" />
                    Quick Access
                </SidebarGroupLabel>
                <SidebarMenu className="space-y-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith('/recent')}
                            className="group hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-lg transition-all duration-200"
                        >
                            <Link href="/recent" prefetch>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-sm">
                                <Clock className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Terbaru</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith('/starred')}
                            className="group hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-900/20 dark:hover:to-orange-900/20 rounded-lg transition-all duration-200"
                        >
                            <Link href="/starred" prefetch>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-sm">
                                <Star className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Favorit</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith('/activity')}
                            className="group hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 rounded-lg transition-all duration-200"
                        >
                            <Link href="/activity" prefetch>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Aktivitas</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* System Management */}
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Cog className="h-3 w-3" />
                    System Management
                </SidebarGroupLabel>
                <SidebarMenu className="space-y-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => toggleExpanded('management')}
                            className="w-full justify-between group hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 dark:hover:from-slate-700/50 dark:hover:to-gray-700/50 rounded-lg transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 text-white shadow-sm">
                                <Settings className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Pengaturan</span>
                            </div>
                            {expandedItems.includes('management') ? (
                                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200" />
                            )}
                        </SidebarMenuButton>
                        {expandedItems.includes('management') && (
                            <SidebarMenuSub className="ml-4 mt-2 space-y-1">
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/storage" prefetch>
                                            <HardDrive className="h-4 w-4 text-blue-500" />
                                            <span>Penyimpanan</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/trash" prefetch>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                            <span>Sampah</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild className="rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                        <Link href="/settings" prefetch>
                                            <Settings className="h-4 w-4 text-purple-500" />
                                            <span>Pengaturan Akun</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* Admin Section */}
            {isAdmin && (
            <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CrownIcon className="h-3 w-3" />
                        Admin Panel
                    </SidebarGroupLabel>
                    <SidebarMenu className="space-y-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                                onClick={() => toggleExpanded('admin')}
                                className="w-full justify-between group hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 rounded-lg transition-all duration-200 border border-red-200/50 dark:border-red-800/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-sm">
                                        <Crown className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium text-red-700 dark:text-red-300">Admin Panel</span>
                                </div>
                                {expandedItems.includes('admin') ? (
                                    <ChevronDown className="h-4 w-4 text-red-400 transition-transform duration-200" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-red-400 transition-transform duration-200" />
                                )}
                        </SidebarMenuButton>
                            {expandedItems.includes('admin') && (
                                <SidebarMenuSub className="ml-4 mt-2 space-y-1">
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild className="rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200">
                                            <Link href="/admin/storage-locations" prefetch>
                                                <Server className="h-4 w-4 text-red-500" />
                                                <span>Storage Locations</span>
                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
            )}

            {/* Storage Info - Enhanced */}
            <SidebarGroup className="px-2 py-0">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/50 p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-400/5 animate-pulse" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
                                <Database className="h-3 w-3" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Storage Usage
                        </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                    Used
                                </span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                    2.4 GB
                                </span>
                            </div>
                            <div className="relative">
                                <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                        style={{ width: '24%' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    of 10 GB
                                </span>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    24%
                                </span>
                        </div>
                        </div>
                    </div>
                </div>
            </SidebarGroup>
        </div>
    );
}
