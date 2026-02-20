'use client';

import {useEffect, useState} from "react";
import {collection, doc, getDoc, getDocs, query, where} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/header";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import BannerCarousel from '@/components/bannerCarousel';
import Image from "next/image";
import ResourceModal from "@/components/ResourceModal"; // Bỏ import { Resource } đi
import { UserResource } from "@/app/profile/page"; // 🌟 Mượn chuẩn cấu trúc từ trang Profile sang

interface Tag {
    id: string;
    name: string;
    categoryID: string;
}

export default function Home() {
    // 🌟 Đổi State sang dùng UserResource
    const [selectedResource, setSelectedResource] = useState<UserResource | null>(null);
    const [resources, setResources] = useState<UserResource[]>([]);
    const [loadingRes, setLoadingRes] = useState(false);

    const [currentCatId, setCurrentCatId] = useState<string | null>(null); // ID danh mục đang chọn
    const [tags, setTags] = useState<Tag[]>([]); // List tags động

    const leftTopImages = [
        "/img/605767988_1314334270732246_911786112392813220_n.jpg",
        "/img/605786348_1314334274065579_5836290016003964505_n.jpg",
        "/img/613486519_1321499280015745_3422481176395387522_n.jpg"
    ];

    const leftBottomImages = [
        "/img/540044278_122189256524357607_6216193388194918061_n.jpg",
        "/img/545651102_122190637460357607_4889303007746054014_n.jpg",
        "/img/598088736_122204381366357607_7143118136886401348_n.jpg",
        "/img/600237439_122204381402357607_4907330399187560766_n.jpg"
    ];

    const mainImages = [
        "/img/notify1.webp",
        "/img/Backdrop 2026 - 50.png"
    ];

    useEffect(() => {
        const fetchTagsByCategory = async () => {
            if (!currentCatId) return;

            try {
                const q = query(
                    collection(db, "tags"),
                    where("categoryID", "==", currentCatId),
                    where("isActive", "==", true)
                );

                const snapshot = await getDocs(q);
                const fetchedTags: Tag[] = [];
                snapshot.forEach(doc => {
                    fetchedTags.push({ id: doc.id, ...doc.data() } as Tag);
                });

                setTags(fetchedTags);
            } catch (err) {
                console.error("Lỗi lấy tags:", err);
            }
        };

        fetchTagsByCategory();
    }, [currentCatId]);

    // 🌟 HÀM FETCH RESOURCES (ĐÃ SỬA CHUẨN)
    useEffect(() => {
        const fetchResources = async () => {
            if (!currentCatId) return;

            setLoadingRes(true);
            setResources([]); // Xóa data cũ đi trước khi load data tab mới

            try {
                const q = query(
                    collection(db, "resources"),
                    where("categoryId", "==", currentCatId), // (Lưu ý: Check lại xem DB là categoryId hay categoryID nhé)
                    where("isActive", "==", true)
                );

                const querySnapshot = await getDocs(q);

                const fetchedDataPromises = querySnapshot.docs.map(async (resDoc) => {
                    const data = resDoc.data();

                    // XỬ LÝ LINK ẢNH GOOGLE DRIVE
                    // (Lưu ý: Bạn đang viết sai cú pháp chuỗi template literals. Dấu {} phải có $ phía trước)
                    const driveImageId = data.image;
                    // 🌟 Sửa lại link ảnh Drive chuẩn:
                    const imageUrl = driveImageId ? `https://drive.google.com/thumbnail?id=${driveImageId}&sz=w800` : "";

                    // XỬ LÝ NGÀY THÁNG
                    let dateStr = "Vừa xong";
                    if (data.createdAt && data.createdAt.seconds) {
                        dateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN');
                    }

                    let authorName = "Ẩn danh";
                    let authorAvatar = "";

                    if (data.userId) {
                        try {
                            const userSnap = await getDoc(doc(db, "users", data.userId));
                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                authorName = userData.name;
                                authorAvatar = userData.photoURL;
                            }
                        } catch (err) {
                            console.error("Lỗi lấy thông tin user:", err);
                        }
                    }

                    let tagNames: string[] = [];
                    if (data.tags && Array.isArray(data.tags)) {
                        // 🌟 THÊM BỘ LỌC CHỐNG LỖI RỖNG TAGS TỪ FIREBASE
                        const validTagIds = data.tags.filter((id: unknown): id is string => typeof id === 'string' && id.trim() !== '');

                        try {
                            const tagPromises = validTagIds.map(async (tagId: string) => {
                                const tagSnap = await getDoc(doc(db, "tags", tagId.trim()));
                                return tagSnap.exists() ? tagSnap.data().name : tagId;
                            });

                            tagNames = await Promise.all(tagPromises);
                        } catch (err) {
                            console.error("Lỗi lấy tags:", err);
                        }
                    }

                    // 🌟 TRẢ VỀ CHUẨN BỘ KHUNG UserResource (Không ép kiểu lươn lẹo nữa)
                    return {
                        id: resDoc.id,
                        title: data.title || "Chưa đặt tên",
                        description: data.description || "Không có mô tả",
                        fileURL: data.fileURL || "",
                        image: data.image || "",
                        previewUrl: imageUrl,
                        tags: tagNames,
                        formatFile: data.formatFile || "Unknown",
                        privacy: data.privacy || "Công khai",
                        license: data.license || "Miễn phí",
                        views: data.views || 0,
                        downloads: data.downloads || 0,
                        uploadDate: dateStr,
                        author: authorName,
                        authorAvatar: authorAvatar,
                        categoryId: data.categoryId || "",
                        fileSize: "Unknown"
                    } as UserResource; // Ép kiểu đàng hoàng và hợp lệ
                });

                const finalData = await Promise.all(fetchedDataPromises);
                setResources(finalData);
            } catch (error) {
                console.error("Lỗi lấy resources:", error);
            } finally {
                setLoadingRes(false);
            }
        };

        fetchResources();
    }, [currentCatId]);

    return (
        <main className="min-h-screen bg-[#eeeeee] font-sans">
            {/* --- (Phần UI Header, Banner, Navbar giữ nguyên không đổi) --- */}
            <Header/>
            <section className="h-[calc(100vh-140px)] p-4 md:p-6 w-full">
                <div className="container mx-auto h-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                        <div className="md:col-span-1 flex flex-col gap-4 h-full">
                            <div className="flex-1 relative"><BannerCarousel images={leftTopImages} delay={2500} /></div>
                            <div className="flex-1 relative"><BannerCarousel images={leftBottomImages} delay={3500} /></div>
                        </div>
                        <div className="md:col-span-2 h-full relative"><BannerCarousel images={mainImages} delay={3000} /></div>
                    </div>
                </div>
            </section>

            <Navbar activeCategoryId={currentCatId} onSelectCategory={(id) => setCurrentCatId(id)}/>

            <div className="bg-[#eeeeee] py-4">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-2 justify-center min-h-[40px]">
                        {tags.length === 0 && currentCatId && (<span className="text-gray-400 text-sm italic"></span>)}
                        {tags.map((tag) => (
                            <button key={tag.id} className="bg-[#1a4a28] text-white text-xs font-bold px-4 py-2 rounded-[4px] hover:bg-green-800 transition shadow-sm uppercase animate-in fade-in zoom-in duration-300">{tag.name}</button>
                        ))}
                    </div>
                </div>
            </div>

            <section className="px-4 md:px-6 pb-10 flex-grow">
                <div className="container mx-auto bg-white rounded-[30px] p-6 md:p-10 shadow-sm min-h-[500px]">
                    {loadingRes ? (
                        <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">Chưa có tài nguyên nào trong mục này.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {resources.map((item) => (
                                // 🌟 Khi click, truyền thẳng object 'item' chuẩn UserResource
                                <div key={item.id} className="group cursor-pointer" onClick={() => setSelectedResource(item)}>
                                    <div className="aspect-[4/3] bg-[#4b9144] rounded-2xl mb-3 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1 relative overflow-hidden">
                                        {item.previewUrl && (
                                            <Image src={item.previewUrl} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                        )}
                                    </div>
                                    <div className="px-1">
                                        <div className="font-utm font-bold text-lg text-gray-800 truncate">{item.title}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.authorAvatar && (<img src={item.authorAvatar} alt="avt" className="w-5 h-5 rounded-full object-cover"/>)}
                                            <div className="text-sm text-gray-500 font-sans truncate">bởi {item.author}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer/>

            {/* 🌟 Truyền data vào ResourceModal chuẩn đét không còn lỗi */}
            <ResourceModal resource={selectedResource} onClose={() => setSelectedResource(null)}/>
        </main>
    );
}