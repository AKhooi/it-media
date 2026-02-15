'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Category {
    id: string;
    name: string;
    isActive: boolean;
}

interface NavbarProps {
    onSelectCategory: (id: string) => void;
    activeCategoryId: string | null;
}

export default function Navbar({ onSelectCategory, activeCategoryId }: NavbarProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const q = query(collection(db, "categories"), where("isActive", "==", true));
                const querySnapshot = await getDocs(q);

                const data: Category[] = [];
                querySnapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() } as Category);
                });

                // Sắp xếp theo ID
                data.sort((a, b) => parseInt(a.id) - parseInt(b.id));
                setCategories(data);

                // TỰ ĐỘNG CHỌN DANH MỤC ĐẦU TIÊN KHI MỚI VÀO
                if (data.length > 0 && !activeCategoryId) {
                    onSelectCategory(data[0].id);
                }

            } catch (error) {
                console.error("Lỗi category:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <div className="sticky top-0 z-50 bg-white border-y border-gray-200 shadow-sm transition-all">
            <div className="container mx-auto py-3 px-2 md:px-4 flex justify-between items-center gap-2">

                {/* --- 1. NÚT SẮP XẾP (TRÁI) --- */}
                {/* shrink-0: Để nút không bị bóp méo khi màn hình nhỏ */}
                <button className="shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 border-2 border-gray-300 rounded-full text-gray-600 font-bold hover:bg-gray-50 transition bg-white z-10">
                    <span className="hidden md:inline">Sắp xếp</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                {/* --- 2. MENU DANH MỤC (GIỮA) --- */}
                <div className="flex-1 min-w-0 relative group">

                    {/* Fade effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none md:hidden"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none md:hidden"></div>

                    <div className="overflow-x-auto flex justify-start md:justify-center gap-2 md:gap-3 no-scrollbar px-1 py-1 scroll-smooth">

                        {/* TRƯỜNG HỢP 1: ĐANG TẢI (Hiện Skeleton giả lập để đỡ giật) */}
                        {loading ? (
                            [1,2,3,4,5].map(i => <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>)
                        ) : (
                            categories.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelectCategory(item.id)} // Bấm vào thì báo cho cha biết
                                    className={`px-3 md:px-5 py-1.5 rounded-full font-bold text-xs md:text-sm whitespace-nowrap transition shadow-sm flex-shrink-0 uppercase ${
                                        activeCategoryId === item.id
                                            ? "bg-[#1a4a28] text-white ring-2 ring-offset-1 ring-[#1a4a28]" // Active: Màu đậm hơn + Viền
                                            : "bg-[#569d51] text-white hover:bg-[#437a40]"
                                    }`}
                                >
                                    {item.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* --- 3. NÚT BỘ LỌC (PHẢI) --- */}
                <button className="shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 border-2 border-gray-300 rounded-full text-gray-600 font-bold hover:bg-gray-50 transition bg-white z-10">
                    <span className="hidden md:inline">Bộ lọc</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

            </div>
        </div>
    )
}