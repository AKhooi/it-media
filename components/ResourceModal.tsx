'use client';

import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import {useEffect, useState} from "react";
import { useAuth } from "@/context/AuthContext";
import { UserResource } from "@/app/profile/page"; // Đảm bảo bạn đã thêm 'actionText' và 'categoryId' vào interface này nhé
import {useRouter} from "next/navigation";

// Interface nội bộ của bạn (đã được bổ sung)
export interface Resource {
    id: string;
    title: string;
    description: string;
    author: string;
    previewUrl?: string;
    authorAvatar?: string;
    uploadDate: string;
    fileType: string;
    fileSize: string;
    license: string;
    views: number;
    downloads: number;
    tags: string[];
    fileURL?: string;
    categoryId?: string;
    actionText?: string;
}

interface ResourceModalProps {
    resource: UserResource | null;
    onClose: () => void;
}

export default function ResourceModal({ resource, onClose }: ResourceModalProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // 🌟 XỬ LÝ LƯỢT XEM (VIEWS)
    useEffect(() => {
        if (!resource?.id) return;

        const recordView = async () => {
            // Check xem session này người ta đã xem bài này chưa (chống spam view)
            const viewedKey = `viewed_${resource.id}`;
            if (!sessionStorage.getItem(viewedKey)) {
                try {
                    // Cộng 1 vào Database
                    const resourceRef = doc(db, "resources", resource.id);
                    await updateDoc(resourceRef, {
                        views: increment(1)
                    });
                    // Đánh dấu là đã xem trong phiên này
                    sessionStorage.setItem(viewedKey, "true");
                } catch (error) {
                    console.error("Lỗi tăng view:", error);
                }
            }
        };

        recordView();
    }, [resource?.id]);

    if (!resource) return null;

    // 🌟 Check xem đây có phải là danh mục Thủ thuật/Link không
    const isTrickCategory = resource.categoryId === "7";

    const getDirectDownloadUrl = (url: string | undefined) => {
        if (!url) return "";
        try {
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return `https://drive.google.com/uc?export=download&id=${match[1]}`;
            }
        } catch (e) {
            console.error(e);
        }
        return url;
    };

    const handleDownloadClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!user) {
            setShowLoginPrompt(true);
        } else {
            // 1. TĂNG DOWNLOAD TRONG DATABASE
            if (resource?.id) {
                try {
                    const resourceRef = doc(db, "resources", resource.id);
                    await updateDoc(resourceRef, {
                        downloads: increment(1)
                    });
                } catch (error) {
                    console.error("Lỗi tăng download:", error);
                }
            }

            //Nếu là Link/Thủ thuật -> Mở thẳng fileURL, bỏ qua ép tải
            const finalLink = isTrickCategory ? resource.fileURL : getDirectDownloadUrl(resource.fileURL);

            if (finalLink) {
                window.open(finalLink, '_blank', 'noopener,noreferrer');
            } else {
                alert("Rất tiếc, đường dẫn không tồn tại!");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            ></div>

            <div className="relative bg-white w-full max-w-6xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur text-gray-500 hover:text-red-500 hover:bg-white rounded-full shadow-sm transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="w-full md:w-[55%] bg-[#f0f2f5] flex items-center justify-center p-6 md:p-10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#4b9144 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                    <div className="relative w-full aspect-[4/3] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden bg-[#4b9144] group">
                        {resource.previewUrl ? (
                            <Image src={resource.previewUrl} alt={resource.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">Không có ảnh xem trước</div>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-[45%] flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar bg-white">

                    <div className="flex items-center gap-2 mb-3">
                       <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${isTrickCategory ? "bg-orange-100 text-orange-600" : "bg-green-100 text-[#4b9144]"}`}>
                          {isTrickCategory ? "Thủ thuật & Mẹo" : "Graphics"}
                       </span>
                        <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 8.2 1.966 9.336 6.41.147.554.147 1.125 0 1.68A10.004 10.004 0 0 1 10 17C1.797 17 2.147 15.034 1.01 10.59l-.346-.002Z" clipRule="evenodd" /></svg>
                            {resource.views.toLocaleString()} xem
                       </span>
                    </div>

                    <h2 className="font-utm font-bold text-3xl md:text-4xl text-gray-900 leading-tight mb-4">{resource.title}</h2>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4b9144] to-green-300 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {resource.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Đăng bởi</p>
                            <p className="text-sm font-bold text-gray-900">{resource.author}</p>
                        </div>
                        <button className="text-xs bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 px-3 py-1.5 rounded-lg font-bold transition">
                            Follow
                        </button>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">Mô tả</h3>
                        <p className="text-gray-600 text-sm leading-relaxed text-justify">{resource.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {/* 🌟 Nếu KHÔNG PHẢI danh mục 7 thì mới hiện ô Định dạng và Dung lượng */}
                        {!isTrickCategory && (
                            <>
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></div>
                                    <div><p className="text-xs text-gray-500">Định dạng</p><p className="font-bold text-gray-900 font-utm">{resource.formatFile}</p></div>
                                </div>
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg></div>
                                    <div><p className="text-xs text-gray-500">Dung lượng</p><p className="font-bold text-gray-900 font-utm">{resource.fileSize}</p></div>
                                </div>
                            </>
                        )}

                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg></div>
                            <div><p className="text-xs text-gray-500">Giấy phép</p><p className="font-bold text-gray-900 font-utm">{resource.license === 'premium' ? 'Premium' : resource.license === 'free' ? 'Free' : resource.license}</p></div>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg></div>
                            <div><p className="text-xs text-gray-500">Ngày đăng</p><p className="font-bold text-gray-900 font-utm">{resource.uploadDate}</p></div>
                        </div>
                    </div>

                    <div className="mb-8 flex flex-wrap gap-2">
                        {resource.tags.map((tag, i) => (
                            <span key={i} className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition cursor-pointer">#{tag}</span>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 flex gap-4">
                        {/* 🌟 Biến đổi Nút bấm */}
                        <button
                            onClick={handleDownloadClick}
                            className={`flex-1 text-white font-utm font-bold text-lg py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${isTrickCategory ? "bg-[#f57c00] hover:bg-[#e65100]" : "bg-[#4b9144] hover:bg-[#3a7535]"}`}
                        >
                            {isTrickCategory ? (
                                // Icon mũi tên mở tab mới (Link icon)
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                            ) : (
                                // Icon mũi tên tải xuống cũ
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            )}

                            {/* Hiển thị dòng chữ tùy chỉnh cho Thủ thuật, hoặc TẢI XUỐNG cho file */}
                            {isTrickCategory ? (resource.actionText || "TRUY CẬP NGAY") : `TẢI XUỐNG ${resource.license === 'free' ? "MIỄN PHÍ" : "PREMIUM"}`}
                        </button>

                        <button className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
                        </button>
                    </div>
                </div>

                {/* --- LOGIN OVERLAY GIỮ NGUYÊN --- */}
                {showLoginPrompt && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-[24px]">
                        <div className="bg-white p-8 rounded-[24px] shadow-2xl max-w-sm w-full text-center border border-gray-100 animate-in zoom-in duration-200">
                            <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black font-utm text-gray-800 mb-2">YÊU CẦU ĐĂNG NHẬP</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                Bạn cần đăng nhập vào hệ thống để có thể tiếp tục xem nội dung này!
                            </p>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => { onClose(); router.push('/login'); }} className="w-full bg-[#4b9144] hover:bg-[#3a7535] text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95">Đăng nhập ngay</button>
                                <button onClick={() => setShowLoginPrompt(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3.5 rounded-xl transition-all active:scale-95">Hủy bỏ</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}