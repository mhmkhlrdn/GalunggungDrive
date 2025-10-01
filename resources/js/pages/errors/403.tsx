import { Head, Link } from '@inertiajs/react';
import { Shield, Home, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center px-4">
            <Head title="Akses Ditolak - 403" />
            
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-8">
                    <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Shield className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                {/* Error Code */}
                <div className="mb-4">
                    <h1 className="text-6xl font-bold text-red-600 dark:text-red-400 mb-2">403</h1>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                        Akses Ditolak
                    </h2>
                </div>

                {/* Error Message */}
                <div className="mb-8">
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Anda mungkin perlu login atau memiliki hak akses yang sesuai.</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Link href="/dashboard">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Home className="w-4 h-4 mr-2" />
                            Kembali ke Dashboard
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
                        Butuh Bantuan?
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Jika Anda yakin ini adalah kesalahan, silakan hubungi administrator sistem.
                    </p>
                </div>
            </div>
        </div>
    );
}

