import { Head, Link } from '@inertiajs/react';
import { FileX, Home, ArrowLeft, Search, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center px-4">
            <Head title="Halaman Tidak Ditemukan - 404" />
            
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-8">
                    <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <FileX className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>

                {/* Error Code */}
                <div className="mb-4">
                    <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">404</h1>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                        Halaman Tidak Ditemukan
                    </h2>
                </div>

                {/* Error Message */}
                <div className="mb-8">
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Maaf, halaman yang Anda cari tidak dapat ditemukan.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <Search className="w-4 h-4" />
                        <span>URL mungkin salah atau halaman telah dipindahkan.</span>
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

                {/* Quick Links */}
                <div className="mt-8">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                        Mungkin Anda Mencari:
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Link href="/files">
                            <Button variant="outline" size="sm" className="w-full">
                                <Folder className="w-3 h-3 mr-1" />
                                File Saya
                            </Button>
                        </Link>
                        <Link href="/shared">
                            <Button variant="outline" size="sm" className="w-full">
                                <Search className="w-3 h-3 mr-1" />
                                File Dibagikan
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Additional Help */}
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Butuh Bantuan?
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Periksa URL atau gunakan navigasi untuk menemukan apa yang Anda cari.
                    </p>
                </div>
            </div>
        </div>
    );
}

