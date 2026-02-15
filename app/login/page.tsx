'use client';

import {useEffect, useState} from 'react';
import {onAuthStateChanged, signInWithPopup} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Nếu đã đăng nhập -> Chuyển hướng ngay lập tức
                router.push('/profile');
            } else {
                // Nếu chưa đăng nhập -> Tắt màn hình chờ, hiện Form
                setIsCheckingAuth(false);
            }
        });

        // Dọn dẹp listener khi thoát trang
        return () => unsubscribe();
    }, [router]);

    // Hàm xử lý đăng nhập Google
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Mở Popup đăng nhập Google
            await signInWithPopup(auth, googleProvider);

            // Đăng nhập thành công -> Chuyển hướng về trang chủ
            router.push('/');
        } catch (err: any) {
            console.error(err);
            setError('Đăng nhập thất bại. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4b9144]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#eeeeee] p-4">

            {/* Khung đăng nhập */}
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl flex flex-col items-center animate-in fade-in zoom-in duration-300">

                {/* Logo (Thay bằng ảnh thật nếu có) */}
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-[#4b9144] uppercase tracking-tighter">
                        designnonglam
                    </h1>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-2">Chào mừng trở lại!</h2>
                <p className="text-gray-500 text-sm mb-8 text-center">
                    Đăng nhập để tải tài nguyên và chia sẻ thiết kế cùng cộng đồng.
                </p>

                {/* Thông báo lỗi nếu có */}
                {error && (
                    <div className="w-full bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">
                        {error}
                    </div>
                )}

                {/* Nút đăng nhập Google */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                    {isLoading ? (
                        // Spinner Loading khi đang bấm
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        // Icon Google
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    )}

                    <span>Tiếp tục với Google</span>
                </button>

                {/* Nút Quay về (Phụ) */}
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 text-sm text-gray-400 hover:text-[#4b9144] hover:underline"
                >
                    ← Quay về trang chủ
                </button>

            </div>
        </div>
    );
}