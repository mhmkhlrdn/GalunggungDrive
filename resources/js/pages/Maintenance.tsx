import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Home, RefreshCw, LogIn } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function Maintenance() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <Head title="Maintenance Mode" />

            <div className="w-full max-w-md">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                            <Wrench className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            Sedang Maintenance
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            Situs sedang dalam mode maintenance. Kami sedang melakukan perbaikan untuk memberikan pengalaman yang lebih baik.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            <p>Kami akan kembali segera. Terima kasih atas kesabaran Anda.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Coba Lagi
                            </Button>


                            <Button asChild className="flex items-center gap-2">
                                <Link href="/">
                                    <Home className="h-4 w-4" />
                                    Kembali ke Landing Page
                                </Link>
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-400">
                                Jika masalah berlanjut, silakan hubungi administrator.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
