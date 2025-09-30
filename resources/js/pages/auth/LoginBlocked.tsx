import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, Clock, MapPin, LogIn, ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Props {
    message: string;
    lastLoginAt: string | null;
    lastLoginIp: string | null;
}

export default function LoginBlocked({ message, lastLoginAt, lastLoginIp }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/force-logout');
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Tidak diketahui';
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title="Akun Sedang Digunakan" />
            
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                            Akun Sedang Digunakan
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {message}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Clock className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Terakhir Masuk
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatDate(lastLoginAt)}
                                    </p>
                                </div>
                            </div>

                            {lastLoginIp && (
                                <div className="flex items-center space-x-3">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            Alamat IP
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {lastLoginIp}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Paksa Keluar dan Masuk
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Jika Anda yakin bahwa ini adalah akun Anda, Anda dapat memaksa keluar dari sesi lain dan masuk dengan akun ini.
                            </p>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Masukkan email Anda"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Kata Sandi
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Masukkan kata sandi Anda"
                                        required
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Ingat saya
                                    </label>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <LogIn className="h-4 w-4 mr-2" />
                                        {processing ? 'Memproses...' : 'Paksa Keluar & Masuk'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Kembali ke Halaman Masuk
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
