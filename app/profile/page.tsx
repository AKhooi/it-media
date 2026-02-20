'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import Image from 'next/image';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import ResourceModal from "@/components/ResourceModal";
import UploadModal from "@/components/UploadModal";

interface Category {
    id: string;
    name: string;
    isActive: boolean;
}

// ĐỒNG BỘ CẤU TRÚC DỮ LIỆU ĐẦY ĐỦ
export interface UserResource {
    id: string;
    title: string;
    description: string;
    fileURL: string;
    image: string; // Lưu ý: Database đang lưu image là ID của drive (ví dụ: 1ABC...)
    previewUrl: string; // Link drive đã ghép hoàn chỉnh để hiển thị
    tags: string[]; // Đã dịch ra chữ (VD: ["Đồ họa", "Poster"])
    formatFile: string;
    privacy: string;
    license: string;
    views: number;
    downloads: number;
    uploadDate: string; // Chữ hiển thị ngày
    author: string;
    authorAvatar: string;
    categoryId: string; // Thêm trường này để dễ edit
    fileSize: string;
    actionText?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>("");
    const [resources, setResources] = useState<UserResource[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);

    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [selectedResourceView, setSelectedResourceView] = useState<UserResource | null>(null);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedResourceEdit, setSelectedResourceEdit] = useState<UserResource | null>(null);

    const handleViewResource = (resource: UserResource) => {
        setSelectedResourceView(resource);
        setIsResourceModalOpen(true);
    };

    const handleEditResource = (e: React.MouseEvent, resource: UserResource) => {
        e.stopPropagation(); // Ngăn click xuyên xuống View
        setSelectedResourceEdit(resource);
        setIsUploadModalOpen(true);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) router.push('/login');
            else { setUser(currentUser); setLoading(false); }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const q = query(collection(db, "categories"), where("isActive", "==", true));
                const snap = await getDocs(q);
                const cats = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name, isActive: doc.data().isActive }));
                setCategories(cats);
                if (cats.length > 0) setActiveTabId(cats[0].id);
            } catch (error) { console.error("Lỗi lấy danh mục:", error); }
        };
        fetchCategories();
    }, []);

    // FETCH FULL DATA (Để xem và sửa)
    useEffect(() => {
        const fetchUserResources = async () => {
            if (!user || !activeTabId) return;
            setLoadingResources(true);
            setResources([]);
            try {
                const q = query(
                    collection(db, "resources"),
                    where("userId", "==", user.uid),
                    where("categoryId", "==", activeTabId)
                );

                const snap = await getDocs(q);

                const fetchedDataPromises = snap.docs.map(async (resDoc) => {
                    const data = resDoc.data();

                    // Xử lý link ảnh Drive
                    const previewUrl = data.image ? `https://drive.google.com/thumbnail?id=${data.image}&sz=w800` : "";

                    // Xử lý ngày tháng
                    let dateStr = "Vừa xong";
                    if (data.createdAt && data.createdAt.seconds) {
                        dateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN');
                    }

                    // Xử lý Tags (ID -> Tên)
                    let tagNames: string[] = [];
                    if (data.tags && Array.isArray(data.tags)) {
                        const validTagIds = data.tags.filter((id: unknown) => id && typeof id === 'string' && id.trim() !== '');

                        const tagPromises = validTagIds.map(async (tagId: string) => {
                            try {
                                const tagSnap = await getDoc(doc(db, "tags", tagId.trim()));
                                return tagSnap.exists() ? tagSnap.data().name : tagId;
                            } catch (err) {
                                console.error("Lỗi lấy tag có ID:", tagId, err);
                                return tagId; // Nếu lỗi, in tạm ID ra cho web không bị sập
                            }
                        });
                        tagNames = await Promise.all(tagPromises);
                    }

                    return {
                        id: resDoc.id,
                        title: data.title || "Chưa có tên",
                        description: data.description || "",
                        fileURL: data.fileURL || "",
                        image: data.image || "",
                        previewUrl: previewUrl,
                        tags: tagNames,
                        formatFile: data.formatFile || "Unknown",
                        privacy: data.privacy || "Công khai",
                        license: data.license || "Miễn phí",
                        views: data.views || 0,
                        downloads: data.downloads || 0,
                        uploadDate: dateStr,
                        author: user.displayName || "Ẩn danh",
                        authorAvatar: user.photoURL || "",
                        categoryId: data.categoryId || "",
                        fileSize: "Unknown"
                    } as UserResource;
                });

                const finalData = await Promise.all(fetchedDataPromises);
                setResources(finalData);
            } catch (error) {
                console.error("Lỗi lấy tài nguyên:", error);
            } finally {
                setLoadingResources(false);
            }
        };

        fetchUserResources();
    }, [user, activeTabId]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#eeeeee]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4b9144]"></div></div>
    );

    return (
        <main className="min-h-screen bg-[#eeeeee] font-sans flex flex-col">
            <Header />
            <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 flex-grow">
                {/* --- 1. SIDEBAR --- (Giữ nguyên code của bạn) */}
                <div className="w-full md:w-1/4 flex flex-col items-center">
                    <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4">
                        {user?.photoURL ? (
                            <Image src={user.photoURL} alt="Avatar" fill className="rounded-full border-[6px] border-white shadow-md object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-[#4b9144] border-[6px] border-white flex items-center justify-center text-white text-6xl font-black uppercase">
                                {user?.displayName?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black font-utm text-[#1a4a28] text-center uppercase leading-none mb-1">{user?.displayName || "Chưa đặt tên"}</h1>
                    <p className="text-gray-500 text-sm mb-6 text-center">{user?.email}</p>
                    <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-6 grid grid-cols-3 gap-2 text-center divide-x divide-gray-100">
                        <div><div className="text-lg font-black text-[#4b9144]">{resources.length}</div><div className="text-[10px] text-gray-400 font-bold uppercase">Files</div></div>
                        <div><div className="text-lg font-black text-[#4b9144]">1.5k</div><div className="text-[10px] text-gray-400 font-bold uppercase">Views</div></div>
                        <div><div className="text-lg font-black text-[#4b9144]">340</div><div className="text-[10px] text-gray-400 font-bold uppercase">Tải</div></div>
                    </div>
                    <div className="text-sm text-gray-600 mb-6 text-center leading-relaxed">Xin chào, mình là sinh viên K48 Khoa CNTT. Mình đam mê thiết kế UI/UX và Photography. Kết bạn giao lưu nhé!</div>
                    <button className="w-full bg-[#4b9144] hover:bg-[#3a7535] text-white font-bold py-2.5 rounded-full shadow-md transition mb-3">CHỈNH SỬA THÔNG TIN</button>
                    <button onClick={handleLogout} className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold py-2.5 rounded-full transition flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg> Đăng xuất
                    </button>
                </div>

                {/* --- 2. MAIN CONTENT --- */}
                <div className="w-full md:w-3/4">
                    <div className="flex overflow-x-auto gap-4 md:gap-8 border-b-2 border-gray-200 pb-2 mb-6 no-scrollbar">
                        {categories.map((cat) => (
                            <button key={cat.id} onClick={() => setActiveTabId(cat.id)} className={`text-sm md:text-lg font-bold uppercase whitespace-nowrap transition-all pb-2 -mb-2.5 border-b-4 ${activeTabId === cat.id ? "text-[#4b9144] border-[#4b9144]" : "text-gray-400 border-transparent hover:text-gray-600"}`}>{cat.name}</button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {/* Nút Upload */}
                        <div onClick={() => setIsUploadModalOpen(true)} className="aspect-square bg-[#4b9144] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#3a7535] transition shadow-sm group">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#4b9144" className="w-6 h-6 md:w-8 md:h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            </div>
                            <span className="text-white font-bold text-sm uppercase tracking-wide">Tải lên mới</span>
                        </div>

                        {/* Danh sách File */}
                        {loadingResources ? (
                            <div className="col-span-full py-10 text-center text-gray-500 font-medium">Đang tải tài nguyên...</div>
                        ) : resources.length === 0 ? (
                            <div className="col-span-full py-10 text-center text-gray-400 italic">Bạn chưa tải lên tài nguyên nào.</div>
                        ) : (
                            resources.map((item) => (
                                <div key={item.id} className="group cursor-pointer flex flex-col" onClick={() => handleViewResource(item)}>
                                    <div className="aspect-square bg-gray-200 rounded-3xl mb-3 relative overflow-hidden">
                                        {item.previewUrl ? (
                                            <Image src={item.previewUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                        )}
                                        {/* Nút Sửa */}
                                        <div onClick={(e) => handleEditResource(e, item)} className="absolute top-2 right-2 bg-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-gray-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="gray" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm truncate w-full px-1">{item.title}</h3>
                                    <p className="text-xs text-gray-500 px-1 mt-0.5">{item.views} lượt xem</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <Footer />

            {/* MODALS */}
            {isResourceModalOpen && (
                <ResourceModal resource={selectedResourceView} onClose={() => setIsResourceModalOpen(false)} />
            )}

            {/* Sửa lại cách gọi UploadModal để nó re-render khi file mới được thêm/sửa */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setSelectedResourceEdit(null);
                    // Reload lại trang profile sau khi đóng UploadModal để thấy cập nhật
                    window.location.reload();
                }}
                editData={selectedResourceEdit}
            />
        </main>
    );
}