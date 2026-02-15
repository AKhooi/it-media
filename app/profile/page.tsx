'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import Image from 'next/image';
import Header from '@/app/components/header';
import Footer from '@/app/components/footer';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("Đồ Họa"); // Tab đang chọn

    // Danh sách tabs giống trong ảnh
    const tabs = ["Đồ Họa", "Logo", "Mẫu Video", "Slide", "Tư Liệu", "Phần Mềm", "Thủ Thuật"];

    // Dữ liệu giả lập các file user đã up
    const myUploads = Array(5).fill(null).map((_, i) => ({ id: i }));

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4b9144]"></div>
        </div>
    );

    return (
        <main className="min-h-screen bg-[#eeeeee] font-sans flex flex-col">
            <Header />

            {/* Container chính */}
            <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 flex-grow">

                {/* --- 1. SIDEBAR (CỘT TRÁI - THÔNG TIN) --- */}
                <div className="w-full md:w-1/4 flex flex-col items-center md:items-start">

                    {/* Avatar lớn */}
                    <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4">
                        {user?.photoURL ? (
                            <Image
                                src={user.photoURL}
                                alt="Avatar"
                                fill
                                className="rounded-full border-[6px] border-white shadow-md object-cover"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-[#4b9144] border-[6px] border-white flex items-center justify-center text-white text-6xl font-black uppercase">
                                {user?.displayName?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>

                    {/* Tên & Email */}
                    <h1 className="text-2xl md:text-3xl font-black font-utm text-[#1a4a28] text-center md:text-left uppercase leading-none mb-1">
                        {user?.displayName || "Chưa đặt tên"}
                    </h1>
                    <p className="text-gray-500 text-sm mb-6">{user?.email}</p>

                    {/* --- PHẦN THÊM MỚI: THÔNG SỐ (STATS) ---
                Thay thế cho thanh dung lượng, giúp profile nhìn đầy đặn hơn
            */}
                    <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-6 grid grid-cols-3 gap-2 text-center divide-x divide-gray-100">
                        <div>
                            <div className="text-lg font-black text-[#4b9144]">12</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">Files</div>
                        </div>
                        <div>
                            <div className="text-lg font-black text-[#4b9144]">1.5k</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">Views</div>
                        </div>
                        <div>
                            <div className="text-lg font-black text-[#4b9144]">340</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">Tải</div>
                        </div>
                    </div>

                    {/* Bio ngắn */}
                    <div className="text-sm text-gray-600 mb-6 text-center md:text-left leading-relaxed">
                        Xin chào, mình là sinh viên K48 Khoa CNTT. Mình đam mê thiết kế UI/UX và Photography. Kết bạn giao lưu nhé!
                    </div>

                    {/* Nút Chỉnh sửa */}
                    <button className="w-full bg-[#4b9144] hover:bg-[#3a7535] text-white font-bold py-2.5 rounded-full shadow-md transition mb-3">
                        CHỈNH SỬA THÔNG TIN
                    </button>

                    {/* Nút Đăng xuất */}
                    <button
                        onClick={handleLogout}
                        className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold py-2.5 rounded-full transition flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                        </svg>
                        Đăng xuất
                    </button>
                </div>

                {/* --- 2. MAIN CONTENT (CỘT PHẢI - TÀI NGUYÊN) --- */}
                <div className="w-full md:w-3/4">

                    {/* Thanh Menu (Tabs) */}
                    <div className="flex overflow-x-auto gap-4 md:gap-8 border-b-2 border-gray-200 pb-2 mb-6 no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-sm md:text-lg font-bold uppercase whitespace-nowrap transition-all pb-2 -mb-2.5 border-b-4 ${
                                    activeTab === tab
                                        ? "text-[#4b9144] border-[#4b9144]"
                                        : "text-gray-400 border-transparent hover:text-gray-600"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Lưới Tài Nguyên (Grid) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

                        {/* 1. NÚT UPLOAD (DẤU CỘNG) - Luôn nằm đầu tiên */}
                        <div className="aspect-square bg-[#4b9144] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#3a7535] transition shadow-sm group">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#4b9144" className="w-6 h-6 md:w-8 md:h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-sm uppercase tracking-wide">Tải lên mới</span>
                        </div>

                        {/* 2. CÁC FILE ĐÃ UPLOAD */}
                        {myUploads.map((item, index) => (
                            <div key={index} className="group cursor-pointer">
                                {/* Ảnh bìa */}
                                <div className="aspect-square bg-gray-300 rounded-3xl mb-3 relative overflow-hidden">
                                    {/* Giả lập ảnh */}
                                    <div className="absolute inset-0 bg-gray-300 group-hover:scale-105 transition-transform duration-500"></div>

                                    {/* Nút edit nhanh hiện khi hover */}
                                    <div className="absolute top-2 right-2 bg-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="gray" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Thanh Text giả lập (Skeleton) */}
                                <div className="h-4 bg-gray-300 rounded-full w-3/4 mb-1.5"></div>
                                <div className="h-3 bg-gray-200 rounded-full w-1/2"></div>
                            </div>
                        ))}

                    </div>

                </div>

            </div>

            <Footer />
        </main>
    );
}