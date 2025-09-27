import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useState } from 'react';

interface File {
    id: number;
    name: string;
    description?: string;
    tags?: string[];
    visibility: 'private' | 'shared' | 'public';
    mime_type: string;
    size: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    file: File;
    breadcrumbs: BreadcrumbItem[];
}

export default function FileEdit({ file, breadcrumbs }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: file.name,
        description: file.description || '',
        tags: file.tags ? file.tags.join(', ') : '',
        visibility: file.visibility,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/files/${file.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${file.name}`} />
            
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/files">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Files
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit File</h1>
                        <p className="text-muted-foreground">
                            Update file information and settings
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>File Information</CardTitle>
                        <CardDescription>
                            Update the file name, description, tags, and visibility settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">File Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="visibility">Visibility</Label>
                                    <Select
                                        value={data.visibility}
                                        onValueChange={(value) => setData('visibility', value as 'private' | 'shared' | 'public')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select visibility" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="private">Private</SelectItem>
                                            <SelectItem value="shared">Shared</SelectItem>
                                            <SelectItem value="public">Public</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.visibility && (
                                        <p className="text-sm text-red-500">{errors.visibility}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className={errors.description ? 'border-red-500' : ''}
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    value={data.tags}
                                    onChange={(e) => setData('tags', e.target.value)}
                                    placeholder="Enter tags separated by commas"
                                    className={errors.tags ? 'border-red-500' : ''}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Separate multiple tags with commas
                                </p>
                                {errors.tags && (
                                    <p className="text-sm text-red-500">{errors.tags}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end space-x-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/files">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
