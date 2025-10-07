import { Head, Link } from '@inertiajs/react';
import { AlertCircle, Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServerError({ message, errorId }: { message?: string; errorId?: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 flex items-center justify-center px-4">
            <Head title="Kesalahan Server - 500" />

            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-8">
                    <div className="mx-auto w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                    </div>
                </div>

                {/* Error Code */}
                <div className="mb-4">
                    <h1 className="text-6xl font-bold text-orange-600 dark:text-orange-400 mb-2">500</h1>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                        Kesalahan Server
                    </h2>
                </div>

                {/* Error Message */}
                <div className="mb-8">
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        {message || 'Maaf, terjadi kesalahan internal pada server.'}
                    </p>
                    {errorId && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            ID Kesalahan: <code className="font-mono">{errorId}</code>
                        </div>
                    )}
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Tim kami telah diberitahu tentang masalah ini.</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => {
                            if (errorId) {
                                // Log details to the console to help debugging client-side issues
                                console.error('500 Server Error', { errorId });
                            }
                            window.location.reload();
                        }}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Coba Lagi
                    </Button>

                    <Link href="/">
                        <Button variant="outline" className="w-full">
                            <Home className="w-4 h-4 mr-2" />
                            Kembali ke Landing Page
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Halaman Sebelumnya
                    </Button>
                </div>

                {/* Additional Help */}
                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Masalah Berlanjut?
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Jika masalah berlanjut, silakan hubungi administrator sistem atau coba lagi nanti.
                    </p>
                </div>
            </div>
        </div>
    );
}

