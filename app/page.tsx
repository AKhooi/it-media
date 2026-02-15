'use client';
import {useEffect, useState} from "react";
import {collection, getDocs, query, where} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/app/components/header";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import BannerCarousel from '@/app/components/bannerCarousel';
import Image from "next/image";
import ResourceModal, { Resource } from "@/app/components/resourceModal";

interface Tag {
    id: string;
    name: string;
    categoryID: string;
}

export default function Home() {
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
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
            if (!currentCatId) return; // Chưa có ID thì thôi

            try {
                // Truy vấn: Lấy tags có categoryID == currentCatId
                // Lưu ý: Trong Firebase bạn lưu categoryID là string "5" hay number 5 thì nhớ check kỹ nhé.
                // Code này đang giả định là String giống ảnh bạn gửi.
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

    useEffect(() => {
        const fetchResources = async () => {
            if (!currentCatId) return; // Chưa chọn danh mục thì khoan hãy lấy

            setLoadingRes(true);
            try {
                // Truy vấn: Lấy resources có categoryID trùng với menu đang chọn
                const q = query(
                    collection(db, "resources"),
                    where("categoryID", "==", currentCatId)
                    // orderBy("createdAt", "desc") // Nếu muốn mới nhất lên đầu (nhớ tạo index trong Firebase Console nếu nó báo lỗi đỏ)
                );

                const querySnapshot = await getDocs(q);

                const fetchedData = querySnapshot.docs.map((doc) => {
                    const data = doc.data();

                    // XỬ LÝ LINK ẢNH GOOGLE DRIVE
                    // data.image đang là ID (VD: 1lSl684...) -> Chuyển thành Link xem được
                    const driveImageId = data.image;
                    const imageUrl = driveImageId ? `https://lh3.googleusercontent.com/d/${driveImageId}` : null;

                    // XỬ LÝ NGÀY THÁNG (Timestamp -> String)
                    let dateStr = "Vừa xong";
                    if (data.createdAt && data.createdAt.seconds) {
                        dateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN');
                    }

                    return {
                        id: doc.id,
                        title: data.title || "Chưa đặt tên",
                        description: data.description || "Không có mô tả",
                        // Vì DB bạn chưa lưu tên tác giả, mình tạm lấy Avatar làm chuẩn, tên hiển thị là "Admin" hoặc bạn cần fetch thêm bảng Users
                        author: "Admin",
                        authorAvatar: data.avatar || "", // Link avatar từ freepik trong DB
                        uploadDate: dateStr,
                        fileType: data.type || "Unknown",
                        fileSize: "Unknown", // DB chưa có trường này, tạm để Unknown
                        license: "Miễn phí",
                        views: 0, // DB chưa có, tạm để 0
                        downloads: 0,
                        tags: [],
                        // TRƯỜNG QUAN TRỌNG ĐỂ HIỆN ẢNH BÌA
                        previewUrl: imageUrl,
                        fileURL: data.fileURL || ""
                    } as unknown as Resource;
                });

                setResources(fetchedData);
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

            {/* --- 1. HEADER --- */}
            <Header/>
            {/* --- 2. MAIN CONTENT (GRID SYSTEM) --- */}
            <section className="h-[calc(100vh-140px)] p-4 md:p-6 w-full">
                <div className="container mx-auto h-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">

                        {/* Cột trái */}
                        <div className="md:col-span-1 flex flex-col gap-4 h-full">
                            {/* Ô trên: Chạy nhanh (2.5 giây đổi ảnh) */}
                            <div className="flex-1 relative">
                                <BannerCarousel images={leftTopImages} delay={2500} />
                            </div>

                            {/* Ô dưới: Chạy chậm hơn (3.5 giây đổi ảnh) */}
                            <div className="flex-1 relative">
                                <BannerCarousel images={leftBottomImages} delay={3500} />
                            </div>
                        </div>

                        {/* Cột phải (Cột chính) */}
                        <div className="md:col-span-2 h-full relative">
                            {/* Ô to: Chạy bình thường (3 giây) */}
                            <BannerCarousel images={mainImages} delay={3000} />
                        </div>

                    </div>
                </div>
            </section>

            {/* --- 3. FILTER BAR (NAVBAR) --- */}
            <Navbar activeCategoryId={currentCatId} onSelectCategory={(id) => setCurrentCatId(id)}/>

            {/* --- 4. CONTENT --- */}
            {/* 1. Sub-tags Bar (Hàng nút xanh rêu đậm bên dưới Navbar) */}
            <div className="bg-[#eeeeee] py-4">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-2 justify-center min-h-[40px]">
                        {/* Nếu chưa chọn danh mục hoặc không có tag nào */}
                        {tags.length === 0 && currentCatId && (
                            <span className="text-gray-400 text-sm italic"></span>
                        )}

                        {/* Render Tags lấy từ Firebase */}
                        {tags.map((tag) => (
                            <button
                                key={tag.id}
                                className="bg-[#1a4a28] text-white text-xs font-bold px-4 py-2 rounded-[4px] hover:bg-green-800 transition shadow-sm uppercase animate-in fade-in zoom-in duration-300"
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Main Content Container (Cái bảng trắng to đùng bo góc) */}
            <section className="px-4 md:px-6 pb-10 flex-grow">
                <div className="container mx-auto bg-white rounded-[30px] p-6 md:p-10 shadow-sm min-h-[500px]">

                    {loadingRes ? (
                        <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">Chưa có tài nguyên nào trong mục này.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {resources.map((item) => (
                                <div key={item.id} className="group cursor-pointer" onClick={() => setSelectedResource(item)}>

                                    {/* HIỂN THỊ ẢNH TỪ GOOGLE DRIVE */}
                                    <div className="aspect-[4/3] bg-[#4b9144] rounded-2xl mb-3 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1 relative overflow-hidden">
                                        {item.previewUrl && (
                                            <Image
                                                src={item.previewUrl}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        )}
                                    </div>

                                    <div className="px-1">
                                        <div className="font-utm font-bold text-lg text-gray-800 truncate">{item.title}</div>
                                        {/* Hiển thị avatar nhỏ xíu nếu có */}
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.authorAvatar && (
                                                <img src={item.authorAvatar} alt="avt" className="w-5 h-5 rounded-full object-cover"/>
                                            )}
                                            <div className="text-sm text-gray-500 font-sans truncate">bởi {item.author}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* --- 5. FOOTER --- */}
            <Footer/>

            {/* --- 6. RESOURCE MODAL --- */}
            <ResourceModal resource={selectedResource} onClose={() => setSelectedResource(null)}/>
        </main>
    );
}