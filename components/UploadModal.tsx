    'use client';

    import { useState, useEffect } from 'react';
    import { db } from '@/lib/firebase';
    import {collection, getDocs, addDoc, serverTimestamp, query, where} from 'firebase/firestore';
    import { useAuth } from '@/context/AuthContext';

    // 1. Định nghĩa kiểu dữ liệu chuẩn
    interface Category {
        id: string;
        name: string;
        isActive: boolean;
    }

    interface UploadFormData {
        title: string;
        description: string;
        fileURL: string;
        image: string;
        tags: string;
        type: string;
        privacy: string;
        license: string;
    }

    interface UploadModalProps {
        isOpen: boolean;
        onClose: () => void;
    }

    interface Tag {
        id: string;
        name: string;
    }

    const extractDriveID = (url: string) => {
        // Regex tìm chuỗi ID của Google Drive (thường là các ký tự chữ số và dấu gạch ngang, dài hơn 25 ký tự)
        const match = url.match(/[-\w]{25,}/);
        return match ? match[0] : url; // Nếu tìm thấy thì trả về ID, không thì trả về nguyên gốc
    };

    export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
        const { user } = useAuth();

        // State
        const [step, setStep] = useState(1);
        const [categories, setCategories] = useState<Category[]>([]);
        const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
        const [loading, setLoading] = useState(false);
        const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
        const [loadingTags, setLoadingTags] = useState(false);

        const [formData, setFormData] = useState<UploadFormData>({
            title: '',
            description: '',
            fileURL: '',
            image: '',
            tags: '',
            type: '',
            privacy: 'Công khai',
            license: 'Miễn phí'
        });

        useEffect(() => {
            const fetchCategories = async () => {
                if (!isOpen) return;
                try {
                    const querySnapshot = await getDocs(collection(db, "categories"));
                    // Fix lỗi 1: Ép kiểu dữ liệu trả về từ Firebase thành Category
                    const cats: Category[] = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...(doc.data() as { name: string; isActive: boolean }) // Ép kiểu cho data()
                    }));

                    const activeCats = cats.filter(cat => cat.isActive === true);

                    if (activeCats.length > 0) {
                        setCategories(activeCats);
                    }

                } catch (error) {
                    console.error("Lỗi lấy danh mục:", error);
                }
            };
            fetchCategories();
        }, [isOpen]);

        useEffect(() => {
            const fetchTagsByCategory = async () => {
                // Chỉ chạy khi đã chọn danh mục và đang ở bước 2
                if (step !== 2 || !selectedCategory) return;

                setLoadingTags(true);
                try {
                    // Tạo câu lệnh: Tìm tags có categoryId BẰNG VỚI id danh mục đang chọn
                    const q = query(
                        collection(db, "tags"),
                        where("categoryID", "==", selectedCategory.id)
                    );

                    const querySnapshot = await getDocs(q);
                    const tags: Tag[] = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...(doc.data() as { name: string })
                    }));

                    setSuggestedTags(tags);
                } catch (error) {
                    console.error("Lỗi lấy tags:", error);
                } finally {
                    setLoadingTags(false);
                }
            };

            fetchTagsByCategory();
        }, [step, selectedCategory]);

        // Fix lỗi 2: Định nghĩa kiểu tham số 'cat' là Category
        const handleSelectCategory = (cat: Category) => {
            setSelectedCategory(cat);
            setStep(2);
        };

        const handleSubmit = async () => {
            if (!user) return alert("Vui lòng đăng nhập!");
            if (!formData.title || !formData.fileURL || !formData.image) return alert("Vui lòng điền đủ thông tin!");

            setLoading(true);
            try {
                const imageID = extractDriveID(formData.image);
                await addDoc(collection(db, "resources"), {
                    ...formData,
                    image: imageID,
                    categoryID: selectedCategory?.id,
                    userId: user.uid,
                    userEmail: user.email,
                    avatar: user.photoURL,
                    tags: formData.tags.split(',').map(t => t.trim()),
                    createdAt: serverTimestamp(),
                    views: 0,
                    downloads: 0
                });

                alert("Đăng bài thành công!");
                handleClose();
            } catch (error) {
                console.error("Lỗi đăng bài:", error);
                alert("Có lỗi xảy ra, vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        const handleClose = () => {
            setStep(1);
            setFormData({
                title: '', description: '', fileURL: '', image: '',
                tags: '', type: '', privacy: 'Công khai', license: 'Miễn phí'
            });
            onClose();
        };

        const handleAddTag = (tagName: string) => {
            const currentTags = formData.tags;

            // Kiểm tra xem tag đã có chưa để tránh trùng
            if (currentTags.includes(tagName)) return;

            // Nếu input đang trống thì thêm luôn, nếu có rồi thì thêm dấu phẩy
            const newTags = currentTags ? `${currentTags}, ${tagName}` : tagName;
            setFormData({ ...formData, tags: newTags });
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                    {/* HEADER */}
                    <div className="bg-[#4b9144] py-3 text-center relative shrink-0">
                        <h2 className="text-white font-utm font-bold text-xl uppercase tracking-wide">
                            {step === 1 ? "TẢI LÊN" : "TẢI LÊN THIẾT KẾ"}
                        </h2>
                    </div>

                    {/* BODY */}
                    <div className="p-6 overflow-y-auto custom-scrollbar">

                        {/* BƯỚC 1 */}
                        {step === 1 && (
                            <div className="grid grid-cols-2 gap-4">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleSelectCategory(cat)}
                                        className="bg-[#1b4d24] text-white font-bold font-utm py-4 rounded-xl hover:bg-[#143d1c] hover:scale-105 transition-all shadow-md uppercase"
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* BƯỚC 2 */}
                        {step === 2 && (
                            <div className="flex flex-col gap-4">
                                {/* Fix lỗi 3: v đã được hiểu là string nhờ định nghĩa bên dưới */}
                                <InputGroup label="Link Drive/Canva thiết kế" placeholder="Dán link tài nguyên vào đây..."
                                            value={formData.fileURL} onChange={(v) => setFormData({...formData, fileURL: v})} />

                                <InputGroup label="Link Thumbnail (Ảnh mô tả)" placeholder="Dán link ảnh hiển thị..."
                                            value={formData.image} onChange={(v) => setFormData({...formData, image: v})} />

                                <InputGroup label="Tiêu đề" placeholder="VD: Poster Mùa Hè Xanh 2026..."
                                            value={formData.title} onChange={(v) => setFormData({...formData, title: v})} />

                                <div>
                                    <label className="block text-sm font-bold text-black mb-1 font-utm">Mô tả chi tiết</label>
                                    <textarea
                                        className="w-full bg-[#eee] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b9144] min-h-[100px]"
                                        placeholder="Mô tả về thiết kế của bạn..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InputGroup label="Danh mục" value={selectedCategory?.name || ''} disabled={true} />
                                    <InputGroup label="Định dạng File" placeholder="PSD, AI, PPTX..."
                                                value={formData.type} onChange={(v) => setFormData({...formData, type: v})} />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-black mb-2 font-utm">
                                        Gợi ý từ khóa:
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {suggestedTags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleAddTag(tag.name)}
                                                className="px-3 py-1 bg-gray-200 hover:bg-[#4b9144] hover:text-white text-xs rounded-full transition-colors border border-gray-300"
                                            >
                                                + {tag.name}
                                            </button>
                                        ))}

                                        {/* Hiển thị trạng thái */}
                                        {loadingTags && (
                                            <span className="text-xs text-gray-500 italic animate-pulse">Đang tìm từ khóa phù hợp...</span>
                                        )}

                                        {!loadingTags && suggestedTags.length === 0 && (
                                            <span className="text-xs text-gray-400 italic">Chưa có gợi ý cho mục này.</span>
                                        )}
                                    </div>

                                    {/* Ô Input Tags cũ của bạn nằm ở đây */}
                                    <InputGroup
                                        label="Thẻ / Từ khóa (Cách nhau dấu phẩy)"
                                        placeholder="muahe, tinhnguyen, poster..."
                                        value={formData.tags}
                                        onChange={(v) => setFormData({...formData, tags: v})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <SelectGroup label="Quyền riêng tư" value={formData.privacy}
                                                 options={['Công khai', 'Chỉ mình tôi']}
                                                 onChange={(v) => setFormData({...formData, privacy: v})} />

                                    <SelectGroup label="Giấy phép sử dụng" value={formData.license}
                                                 options={['Miễn phí', 'Có phí']}
                                                 onChange={(v) => setFormData({...formData, license: v})} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    {step === 2 && (
                        <div className="p-4 border-t border-gray-100 flex gap-4 shrink-0 bg-white">
                            <button onClick={handleClose} className="flex-1 bg-[#d32f2f] text-white font-bold py-3 rounded-full hover:bg-[#b71c1c] transition-all font-utm">HỦY</button>
                            <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#28a745] text-white font-bold py-3 rounded-full hover:bg-[#218838] transition-all font-utm disabled:opacity-50">
                                {loading ? "ĐANG ĐĂNG..." : "ĐĂNG"}
                            </button>
                        </div>
                    )}
                    {step === 1 && (
                        <div className="p-4 pt-0">
                            <button onClick={handleClose} className="w-full text-gray-500 hover:text-black py-2 text-sm">Đóng</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Fix lỗi 4: Định nghĩa Interface cho Props của component con thay vì dùng 'any'
    interface InputGroupProps {
        label: string;
        placeholder?: string;
        value: string;
        onChange?: (value: string) => void; // Định nghĩa hàm callback trả về string
        disabled?: boolean;
    }

    const InputGroup = ({ label, placeholder, value, onChange, disabled = false }: InputGroupProps) => (
        <div>
            <label className="block text-sm font-bold text-black mb-1 font-utm">{label}</label>
            <input
                type="text"
                disabled={disabled}
                className={`w-full bg-[#eee] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b9144] ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder={placeholder}
                value={value}
                // Kiểm tra nếu có hàm onChange mới gọi
                onChange={(e) => onChange && onChange(e.target.value)}
            />
        </div>
    );

    interface SelectGroupProps {
        label: string;
        value: string;
        options: string[];
        onChange: (value: string) => void;
    }

    const SelectGroup = ({ label, value, options, onChange }: SelectGroupProps) => (
        <div>
            <label className="block text-sm font-bold text-black mb-1 font-utm">{label}</label>
            <select
                className="w-full bg-[#eee] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b9144] appearance-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );