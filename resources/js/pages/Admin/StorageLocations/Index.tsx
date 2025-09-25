import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';

interface StorageLocation {
    id: number;
    name: string;
    key: string;
    driver: string;
    root: string | null;
    url: string | null;
    visibility: 'private' | 'public';
    serve: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface StorageLocationsIndexProps {
    storageLocations: StorageLocation[];
}

export default function StorageLocationsIndex({ storageLocations }: StorageLocationsIndexProps) {
    const [isToggling, setIsToggling] = useState<number | null>(null);

    const handleToggle = (id: number) => {
        setIsToggling(id);
        router.post(`/admin/storage-locations/${id}/toggle`, {}, {
            onFinish: () => setIsToggling(null),
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            router.delete(`/admin/storage-locations/${id}`);
        }
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Storage Locations', href: '/admin/storage-locations' },
            ]}
        >
            <Head title="Storage Locations" />

            <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Storage Locations</h1>
                            <p className="text-muted-foreground">
                                Manage storage locations for your application
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/admin/storage-locations/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Storage Location
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{storageLocations.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {storageLocations.filter(loc => loc.is_active).length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Public Locations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {storageLocations.filter(loc => loc.visibility === 'public').length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Storage Locations</CardTitle>
                            <CardDescription>
                                A list of all storage locations in your system
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Key</TableHead>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Visibility</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="w-[50px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {storageLocations.map((location) => (
                                        <TableRow key={location.id}>
                                            <TableCell className="font-medium">
                                                {location.name}
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                    {location.key}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{location.driver}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={location.visibility === 'public' ? 'default' : 'secondary'}>
                                                    {location.visibility}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={location.is_active ? 'default' : 'destructive'}>
                                                    {location.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(location.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/storage-locations/${location.id}`}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/storage-locations/${location.id}/edit`}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggle(location.id)}
                                                            disabled={isToggling === location.id}
                                                        >
                                                            {location.is_active ? (
                                                                <>
                                                                    <PowerOff className="h-4 w-4 mr-2" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Power className="h-4 w-4 mr-2" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(location.id, location.name)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
            </div>
        </AppSidebarLayout>
    );
}
