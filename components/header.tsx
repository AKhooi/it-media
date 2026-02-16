'use client'

import Link from "next/link";
import {useAuth} from "@/context/AuthContext";
import {useState} from "react";
import UploadModal from "@/components/UploadModal";

export default function Header() {
    const {user} = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <header className="bg-[#4b9144] px-4 py-3 shadow-md">
                <div className="container mx-auto flex items-center justify-between gap-4">

                    {/* Logo */}
                    <Link href="/">
                        <div className="text-white font-family font-bold text-xl md:text-2xl tracking-tighter shrink-0">
                            designnonglam
                        </div>
                    </Link>
                    {/* Search Bar */}
                    <div className="flex-grow max-w-2xl relative">
                        <input
                            type="text"
                            className="w-full pl-4 pr-10 py-2 rounded-full border-none focus:outline-none focus:ring-2 bg-white"
                        />
                        <button
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-[#999] rounded-full text-white hover:bg-gray-600 transition">
                            {/* Icon Search SVG */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}
                                 stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                            </svg>
                        </button>
                    </div>

                    {/* Cụm bên phải: Nút Upload + User Icon */}
                    <div className="flex items-center gap-3 shrink-0">

                        {/* --- 3. NÚT TẢI LÊN (Chỉ hiện khi Đã đăng nhập) --- */}
                        {user && (
                            <div onClick={() => setIsModalOpen(true)}
                                 className="flex items-center gap-2 bg-[#1b4d24] hover:bg-[#143d1c] text-white px-3 py-2 md:px-4 md:py-2 rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95">
                                {/* Icon dấu cộng (Luôn hiện) */}
                                <div className="bg-white rounded-full p-1 flex items-center justify-center">
                                    {/* Icon đổi sang màu xanh cho nổi */}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                         strokeWidth={4} stroke="#1b4d24" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                    </svg>
                                </div>

                                {/* Chữ "Tải lên" (Ẩn trên mobile, Hiện trên Desktop) */}
                                <span className="hidden md:block font-bold text-sm font-utm">Tải lên</span>
                            </div>
                        )}

                        {/* --- 4. User Icon (Đổi link dựa vào trạng thái đăng nhập) --- */}
                        <Link href={"/login"} className="text-white hover:opacity-80 transition relative group">
                            {user?.photoURL ? (
                                // Nếu có Avatar thật thì hiện Avatar
                                <img
                                    src={user.photoURL}
                                    alt="User"
                                    className="w-9 h-9 rounded-full border-2 border-white object-cover"
                                />
                            ) : (
                                // Nếu chưa có Avatar hoặc chưa đăng nhập thì hiện Icon mặc định
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                     className="w-9 h-9">
                                    <path fillRule="evenodd"
                                          d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                                          clipRule="evenodd"/>
                                </svg>
                            )}
                        </Link>

                    </div>
                </div>
            </header>
            <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}></UploadModal>
        </>
    )
}