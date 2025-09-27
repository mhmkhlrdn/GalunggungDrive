import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Beranda',
        href: dashboard(),
        icon: LayoutGrid,
    },
];


export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-slate-200/60 dark:border-slate-700/60">
            <SidebarHeader className="border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/20">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-gradient-to-b from-slate-50/30 to-transparent dark:from-slate-800/30">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-t from-slate-50/50 to-transparent dark:from-slate-800/50">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
