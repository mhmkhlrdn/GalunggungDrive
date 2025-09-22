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
import { type NavItem } from '@/types';
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
    Zap
} from 'lucide-react';
import { useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [expandedItems, setExpandedItems] = useState<string[]>(['files', 'sharing', 'management']);
    
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
        <div className="space-y-6">
            {/* Dashboard */}
            <SidebarGroup className="px-2 py-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url === '/dashboard'}
                            tooltip={{ children: 'Dashboard' }}
                        >
                            <Link href="/dashboard" prefetch>
                                <Home className="h-4 w-4" />
                                <span>Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* File Management */}
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel>Manajemen File</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => toggleExpanded('files')}
                            className="w-full justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>File Saya</span>
                            </div>
                            {expandedItems.includes('files') ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </SidebarMenuButton>
                        {expandedItems.includes('files') && (
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/files" prefetch>
                                            <FolderOpen className="h-4 w-4" />
                                            <span>Semua File</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/files?type=images" prefetch>
                                            <Eye className="h-4 w-4" />
                                            <span>Gambar</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/files?type=documents" prefetch>
                                            <FileText className="h-4 w-4" />
                                            <span>Dokumen</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/files?type=archives" prefetch>
                                            <Archive className="h-4 w-4" />
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
                            tooltip={{ children: 'Folder' }}
                        >
                            <Link href="/folders" prefetch>
                                <Folder className="h-4 w-4" />
                                <span>Folder</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* Sharing & Collaboration */}
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel>Berbagi & Kolaborasi</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => toggleExpanded('sharing')}
                            className="w-full justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Share2 className="h-4 w-4" />
                                <span>Dibagikan</span>
                            </div>
                            {expandedItems.includes('sharing') ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </SidebarMenuButton>
                        {expandedItems.includes('sharing') && (
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/shared" prefetch>
                                            <Share2 className="h-4 w-4" />
                                            <span>Semua Berbagi</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/shared?tab=shared-by-me" prefetch>
                                            <UserCheck className="h-4 w-4" />
                                            <span>Dibagikan oleh Saya</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/shared?tab=shared-with-me" prefetch>
                                            <Users className="h-4 w-4" />
                                            <span>Dibagikan dengan Saya</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/shared?tab=public-links" prefetch>
                                            <Globe className="h-4 w-4" />
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
                <SidebarGroupLabel>Akses Cepat</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith('/recent')}
                            tooltip={{ children: 'File Terbaru' }}
                        >
                            <Link href="/recent" prefetch>
                                <Clock className="h-4 w-4" />
                                <span>Terbaru</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith('/starred')}
                            tooltip={{ children: 'File Favorit' }}
                        >
                            <Link href="/starred" prefetch>
                                <Star className="h-4 w-4" />
                                <span>Favorit</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith('/activity')}
                            tooltip={{ children: 'Log Aktivitas' }}
                        >
                            <Link href="/activity" prefetch>
                                <Activity className="h-4 w-4" />
                                <span>Aktivitas</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* System Management */}
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel>Manajemen Sistem</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => toggleExpanded('management')}
                            className="w-full justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span>Pengaturan</span>
                            </div>
                            {expandedItems.includes('management') ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </SidebarMenuButton>
                        {expandedItems.includes('management') && (
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/storage" prefetch>
                                            <HardDrive className="h-4 w-4" />
                                            <span>Penyimpanan</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/trash" prefetch>
                                            <Trash2 className="h-4 w-4" />
                                            <span>Sampah</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/settings" prefetch>
                                            <Settings className="h-4 w-4" />
                                            <span>Pengaturan Akun</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* Quick Actions */}
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel>Aksi Cepat</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Link href="/files?action=upload" prefetch>
                                <Upload className="h-4 w-4" />
                                <span>Upload File</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Link href="/folders?action=create" prefetch>
                                <FolderPlus className="h-4 w-4" />
                                <span>Buat Folder</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            {/* Storage Info */}
            <SidebarGroup className="px-2 py-0">
                <div className="px-2 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Penyimpanan
                        </span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Digunakan</span>
                            <span>2.4 GB</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Dari 10 GB</span>
                            <span>24%</span>
                        </div>
                    </div>
                </div>
            </SidebarGroup>
        </div>
    );
}
