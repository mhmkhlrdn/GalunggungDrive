import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { UnapprovedUsersBadge } from '@/components/unapproved-users-badge';
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
    Globe,
    Database,
    Folder as FileFolderIcon} from 'lucide-react';
import { useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage<SharedData>();
    const [expandedItems, setExpandedItems] = useState<string[]>(['files', 'sharing', 'management']);
    const isSuperAdmin = page.props.auth.user.role === 'super-admin';
    const isAdmin = ['admin', 'super-admin'].includes(page.props.auth.user.role);

    const toggleExpanded = (itemId: string) => {
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const defaultItems: NavItem[] = [
        {
            title: 'Beranda',
            href: '/home',
            icon: Home,
        },
        {
            title: 'File Saya',
            href: '/files',
            icon: FileText,
        },
        {
            title: 'Folder Saya',
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
            <div className="px-2 py-2">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                    <Link
                        href="/files?action=upload"
                        className="group relative overflow-hidden rounded-lg bg-blue-600 p-3 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
                    >
                        <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                                    <span className="text-sm font-medium">Unggah</span>
                        </div>
                    </Link>
                    <Link
                        href="/folders?action=create"
                        className="group relative overflow-hidden rounded-lg bg-gray-600 p-3 text-white shadow-md transition-all duration-200 hover:bg-gray-700 hover:shadow-lg"
                    >
                        <div className="flex items-center gap-2">
                            <FolderPlus className="h-4 w-4" />
                                    <span className="text-sm font-medium">Folder</span>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Main Navigation */}
            <SidebarMenu className="space-y-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Home className="h-3 w-3" />
                        Utama
                    </SidebarGroupLabel>
                    <SidebarMenuButton asChild className='p-5.5'>
                        <Link href="/dashboard" className="group relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800/50  hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                            <div className="flex items-center gap-3 ">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                                    <Home className="h-4 w-4" />
                                </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Beranda</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Ringkasan & Analitik</div>
                            </div>
                            </div>
                        </Link>
                    </SidebarMenuButton>
                </SidebarGroup>

                {/* File Management Section */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileFolderIcon className="h-3 w-3" />
                        Manajemen File
                    </SidebarGroupLabel>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/files" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium">File Saya</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/folders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Folder className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium">Folder Saya</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/shared" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium">Dibagikan</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/recent" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium">Terbaru</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/starred" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Star className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium">Favorit</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroup>

                {/* Storage & Cloud Section */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <HardDrive className="h-3 w-3" />
                        Penyimpanan
                    </SidebarGroupLabel>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/storage" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <HardDrive className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium">Penyimpanan</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/cloud" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium">Cloud</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>


                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/trash" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium">Sampah</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarGroup>

                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Panel Admin
                        </SidebarGroupLabel>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/admin/storage-locations" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <Database className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm font-medium">Lokasi Penyimpanan</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        {isSuperAdmin && (
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm font-medium">Pengguna</span>
                                        <UnapprovedUsersBadge className="ml-auto" />
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/admin/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm font-medium">Pengaturan</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/activity" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm font-medium">Aktivitas</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>


                    </SidebarGroup>
                )}
            </SidebarMenu>
        </div>
    );
}
