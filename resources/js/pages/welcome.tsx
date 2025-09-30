import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import GasnetLogo from '@/components/gasnet-logo';
import {
    FolderOpen,
    Upload,
    Share2,
    FileText,
    Users,
    Clock,
    ArrowRight,
    Home,
    Folder,
    HardDrive
} from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Galunggung Drive - Penyimpanan Cloud">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Navigation */}
                <header className="relative z-50 border-b border-white/20 bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                                    <FolderOpen className="h-7 w-7 text-white" />
                                </div>
                                <GasnetLogo 
                                    size="lg" 
                                    showText={true} 
                                    showSubtitle={true} 
                                    variant="full"
                                />
                            </div>
                            <nav className="flex items-center space-x-4">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                                    >
                                        Masuk ke Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                                        >
                                            Masuk
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden py-20 sm:py-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 dark:from-blue-600/10 dark:to-indigo-600/10" />
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                                File Sharing
                                <span className="block bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                    Internal Tim
                                </span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                                Tempat yang aman untuk berbagi file dengan rekan kerja. Upload, simpan, dan akses file tim dengan mudah
                                tanpa ribet. Cocok untuk kerja sama antar departemen dan proyek internal.
                            </p>
                            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                {!auth.user && (
                                    <>

                                        <Link
                                            href={login()}
                                            className="inline-flex items-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-900 transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500 dark:hover:bg-slate-700"
                                        >
                                            Masuk
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 sm:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Fitur yang bikin kerja jadi lebih mudah
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                                Semua yang dibutuhkan untuk berbagi file dengan tim, tanpa ribet dan aman
                            </p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: HardDrive,
                                    title: 'Simpan File',
                                    description: 'Upload dan simpan file apapun yang dibutuhkan tim. Tidak ada batasan ukuran yang ribet.',
                                },
                                {
                                    icon: Folder,
                                    title: 'Organisir Rapi',
                                    description: 'Buat folder untuk setiap proyek atau departemen. File jadi lebih mudah dicari dan diatur.',
                                },
                                {
                                    icon: Share2,
                                    title: 'Bagikan Mudah',
                                    description: 'Kirim link file ke rekan kerja dengan sekali klik. Bisa set siapa yang boleh akses.',
                                },
                                {
                                    icon: FileText,
                                    title: 'Riwayat File',
                                    description: 'Lihat versi lama file kalau ada yang salah. Semua perubahan tersimpan otomatis.',
                                },
                                {
                                    icon: Users,
                                    title: 'Kerja Sama Tim',
                                    description: 'Semua anggota tim bisa akses file yang sama. Tidak perlu kirim email bolak-balik.',
                                },
                                {
                                    icon: Clock,
                                    title: 'Akses Cepat',
                                    description: 'File tersimpan di server internal, jadi download dan upload jadi lebih cepat.',
                                },
                            ].map((feature, index) => (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:bg-slate-800"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                                    <div className="relative">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                                            <feature.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 sm:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-16 sm:px-16">
                            <div className="absolute inset-0 bg-white/10" />
                            <div className="relative text-center">
                                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                                    Siap mulai berbagi file?
                                </h2>
                                <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
                                    Gabung dengan tim yang sudah pakai Galunggung Drive untuk berbagi file sehari-hari.
                                    Lebih praktis dari email, lebih aman dari flashdisk.
                                </p>
                                {!auth.user && (
                                    <div className="mt-8">
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-xl transition-all hover:bg-blue-50 hover:shadow-2xl hover:scale-105"
                                        >
                                            Coba Sekarang
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                                    <FolderOpen className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Galunggung Drive
                                </span>
                            </div>
                            <p className="mt-4 text-slate-600 dark:text-slate-300">
                                File sharing internal yang simpel dan aman untuk tim.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
