import { Head, Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Power, PowerOff } from 'lucide-react';
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

interface ShowStorageLocationProps {
    storageLocation: StorageLocation;
}

export default function ShowStorageLocation({ storageLocation }: ShowStorageLocationProps) {
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = () => {
        setIsToggling(true);
        router.post(`/admin/storage-locations/${storageLocation.id}/toggle`, {}, {
            onFinish: () => setIsToggling(false),
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${storageLocation.name}"? This action cannot be undone.`)) {
            router.delete(`/admin/storage-locations/${storageLocation.id}`);
        }
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Admin', href: '#' },
                { title: 'Storage Locations', href: '/admin/storage-locations' },
                { title: storageLocation.name, href: `/admin/storage-locations/${storageLocation.id}` },
            ]}
        >
            <Head title={storageLocation.name} />

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/storage-locations">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{storageLocation.name}</h1>
                                <p className="text-muted-foreground">
                                    Storage location details and configuration
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href={`/admin/storage-locations/${storageLocation.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleToggle}
                                disabled={isToggling}
                            >
                                {storageLocation.is_active ? (
                                    <>
                                        <PowerOff className="h-4 w-4 mr-2" />
                                        {isToggling ? 'Deactivating...' : 'Deactivate'}
                                    </>
                                ) : (
                                    <>
                                        <Power className="h-4 w-4 mr-2" />
                                        {isToggling ? 'Activating...' : 'Activate'}
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>
                                    Core details about this storage location
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                                    <p className="text-lg">{storageLocation.name}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Key</h4>
                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                        {storageLocation.key}
                                    </code>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Driver</h4>
                                    <Badge variant="outline">{storageLocation.driver}</Badge>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                    <Badge variant={storageLocation.is_active ? 'default' : 'destructive'}>
                                        {storageLocation.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration</CardTitle>
                                <CardDescription>
                                    Storage location settings and options
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Visibility</h4>
                                    <Badge variant={storageLocation.visibility === 'public' ? 'default' : 'secondary'}>
                                        {storageLocation.visibility}
                                    </Badge>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Can Serve Files</h4>
                                    <Badge variant={storageLocation.serve ? 'default' : 'secondary'}>
                                        {storageLocation.serve ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                                {storageLocation.root && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Root Path</h4>
                                        <code className="text-sm bg-muted px-2 py-1 rounded block break-all">
                                            {storageLocation.root}
                                        </code>
                                    </div>
                                )}
                                {storageLocation.url && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Public URL</h4>
                                        <a
                                            href={storageLocation.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline break-all"
                                        >
                                            {storageLocation.url}
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Timestamps</CardTitle>
                            <CardDescription>
                                Creation and modification dates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                                <p>{new Date(storageLocation.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
                                <p>{new Date(storageLocation.updated_at).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
        </AppSidebarLayout>
    );
}
