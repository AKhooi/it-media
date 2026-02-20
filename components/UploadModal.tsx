'use client';

import {useState, useEffect} from 'react';
import {db} from '@/lib/firebase';
import {collection, getDocs, addDoc, serverTimestamp, query, where, updateDoc, doc} from 'firebase/firestore';
import {useAuth} from '@/context/AuthContext';

interface Category {
    id: string;
    name: string;
    isActive: boolean;
}

interface Tag {
    id: string;
    name: string;
}

interface UploadFormData {
    title: string;
    description: string;
    fileURL: string;
    image: string;
    tags: string;
    formatFile: string;
    privacy: string;
    license: string;
    actionText: string; // 🌟 THÊM TRƯỜNG NÀY
}

export interface EditData {
    id: string;
    title: string;
    description: string;
    fileURL: string;
    image: string;
    tags: string[];
    formatFile: string;
    privacy: string;
    license: string;
    categoryId: string;
    actionText?: string; // 🌟 THÊM TRƯỜNG NÀY
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    editData?: EditData | null;
}

const extractDriveID = (url: string) => {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : url;
};

export default function UploadModal({isOpen, onClose, editData}: UploadModalProps) {
    const {user} = useAuth();
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
        formatFile: '',
        privacy: 'public',
        license: 'free',
        actionText: 'TRUY CẬP NGAY' // 🌟 Giá trị mặc định
    });

    useEffect(() => {
        const fetchCategories = async () => {
            if (!isOpen) return;
            try {
                const q = query(collection(db, "categories"), where("isActive", "==", true));
                const querySnapshot = await getDocs(q);
                const cats: Category[] = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Category));
                setCategories(cats);

                if (editData) {
                    setFormData({
                        title: editData.title || '',
                        description: editData.description || '',
                        fileURL: editData.fileURL || '',
                        image: editData.image ? `https://drive.google.com/file/d/${editData.image}/view` : '',
                        tags: editData.tags ? editData.tags.join(', ') : '',
                        formatFile: editData.formatFile || '',
                        privacy: editData.privacy || 'public',
                        license: editData.license || 'free',
                        actionText: editData.actionText || 'TRUY CẬP NGAY' // 🌟 Load dữ liệu cũ
                    });

                    const foundCat = cats.find(c => c.id === editData.categoryId);
                    if (foundCat) setSelectedCategory(foundCat);

                    setStep(2);
                } else {
                    setStep(1);
                    setFormData({
                        title: '',
                        description: '',
                        fileURL: '',
                        image: '',
                        tags: '',
                        formatFile: '',
                        privacy: 'public',
                        license: 'free',
                        actionText: 'TRUY CẬP NGAY'
                    });
                    setSelectedCategory(null);
                }
            } catch (error) {
                console.error("Lỗi lấy danh mục:", error);
            }
        };
        fetchCategories();
    }, [isOpen, editData]);

    useEffect(() => {
        const fetchTagsByCategory = async () => {
            if (step !== 2 || !selectedCategory) return;
            setLoadingTags(true);
            try {
                const q = query(collection(db, "tags"), where("categoryID", "==", selectedCategory.id));
                const querySnapshot = await getDocs(q);
                const tags: Tag[] = querySnapshot.docs.map(doc => ({id: doc.id, ...(doc.data() as { name: string })}));
                setSuggestedTags(tags);
            } catch (error) {
                console.error("Lỗi lấy tags:", error);
            } finally {
                setLoadingTags(false);
            }
        };
        fetchTagsByCategory();
    }, [step, selectedCategory]);

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
            const inputTagNames = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
            const finalTagIDs: string[] = [];

            for (const tagName of inputTagNames) {
                const existingTag = suggestedTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
                if (existingTag) {
                    finalTagIDs.push(existingTag.id);
                } else {
                    const newTagRef = await addDoc(collection(db, "tags"), { name: tagName, categoryID: selectedCategory?.id, isActive: true });
                    finalTagIDs.push(newTagRef.id);
                }
            }

            // 🌟 Nếu là ID 7 (Thủ thuật), tự động gán formatFile là N/A cho sạch Database
            const finalData = { ...formData };
            if (selectedCategory?.id === "7") {
                finalData.formatFile = "N/A";
            } else {
                finalData.actionText = ""; // Không phải thủ thuật thì xóa actionText đi cho rảnh nợ
            }

            if (editData && editData.id) {
                const docRef = doc(db, "resources", editData.id);
                await updateDoc(docRef, {
                    ...finalData,
                    image: imageID,
                    tags: finalTagIDs,
                    categoryId: selectedCategory?.id
                });
                alert("Cập nhật bài viết thành công!");
            } else {
                await addDoc(collection(db, "resources"), {
                    ...finalData,
                    image: imageID,
                    categoryId: selectedCategory?.id,
                    userId: user.uid,
                    tags: finalTagIDs,
                    createdAt: serverTimestamp(),
                    views: 0,
                    downloads: 0,
                    isActive: true
                });
                alert("Đăng bài thành công!");
            }

            onClose();
        } catch (error) {
            console.error("Lỗi đăng bài:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = (tagName: string) => {
        const currentTags = formData.tags;
        if (currentTags.includes(tagName)) return;
        const newTags = currentTags ? `${currentTags}, ${tagName}` : tagName;
        setFormData({...formData, tags: newTags});
    };

    if (!isOpen) return null;

    // 🌟 Kiểm tra xem có đang ở danh mục "Thủ thuật" không
    const isTrickCategory = selectedCategory?.id === "7";

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-[#4b9144] py-3 text-center relative shrink-0">
                    <h2 className="text-white font-utm font-bold text-xl uppercase tracking-wide">
                        {editData ? "CẬP NHẬT TÀI NGUYÊN" : (step === 1 ? "TẢI LÊN" : "TẢI LÊN THIẾT KẾ")}
                    </h2>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {step === 1 && (
                        <div className="grid grid-cols-2 gap-4">
                            {categories.map((cat) => (
                                <button key={cat.id} onClick={() => handleSelectCategory(cat)}
                                        className="bg-[#1b4d24] text-white font-bold font-utm py-4 rounded-xl hover:bg-[#143d1c] hover:scale-105 transition-all shadow-md uppercase">{cat.name}</button>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col gap-4">
                            {/* 🌟 Đổi Label nếu là danh mục số 7 */}
                            <InputGroup
                                label={isTrickCategory ? "Link đích đến (Website, Canva...)" : "Link Drive/Canva thiết kế"}
                                placeholder="Dán link vào đây..."
                                value={formData.fileURL}
                                onChange={(v) => setFormData({...formData, fileURL: v})}
                            />

                            {/* 🌟 Hiện ô "Chữ hiển thị trên nút" nếu là danh mục số 7 */}
                            {isTrickCategory && (
                                <InputGroup
                                    label="Chữ hiển thị trên nút bấm"
                                    placeholder="VD: NHẬN CANVA PRO..."
                                    value={formData.actionText}
                                    onChange={(v) => setFormData({...formData, actionText: v})}
                                />
                            )}

                            <InputGroup label="Link Thumbnail (Ảnh mô tả)" placeholder="Dán link ảnh hiển thị..."
                                        value={formData.image} onChange={(v) => setFormData({...formData, image: v})}/>
                            <InputGroup label="Tiêu đề" placeholder={isTrickCategory ? "VD: Nhận 30 ngày Canva Pro miễn phí..." : "VD: Poster Mùa Hè Xanh 2026..."}
                                        value={formData.title} onChange={(v) => setFormData({...formData, title: v})}/>
                            <div>
                                <label className="block text-sm font-bold text-black mb-1 font-utm">Mô tả chi tiết</label>
                                <textarea
                                    className="w-full bg-[#eee] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b9144] min-h-[100px]"
                                    placeholder={isTrickCategory ? "Chia sẻ thủ thuật, hướng dẫn sử dụng..." : "Mô tả về thiết kế của bạn..."}
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}/>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <InputGroup label="Danh mục" value={selectedCategory?.name || ''} disabled={true}/>
                                {/* 🌟 Giấu ô Định dạng nếu là danh mục số 7 */}
                                {!isTrickCategory && (
                                    <InputGroup label="Định dạng File" placeholder="PSD, AI, PPTX..."
                                                value={formData.formatFile}
                                                onChange={(v) => setFormData({...formData, formatFile: v})}/>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-black mb-2 font-utm">Gợi ý từ khóa:</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {suggestedTags.map((tag) => (
                                        <button key={tag.id} onClick={() => handleAddTag(tag.name)}
                                                className="px-3 py-1 bg-gray-200 hover:bg-[#4b9144] hover:text-white text-xs rounded-full transition-colors border border-gray-300">+ {tag.name}</button>
                                    ))}
                                </div>
                                <InputGroup label="Thẻ / Từ khóa (Cách nhau dấu phẩy)"
                                            placeholder="muahe, tinhnguyen, poster..." value={formData.tags}
                                            onChange={(v) => setFormData({...formData, tags: v})}/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <SelectGroup
                                    label="Quyền riêng tư"
                                    value={formData.privacy}
                                    options={[
                                        { label: 'Công khai', value: 'public' },
                                        { label: 'Người theo dõi', value: 'followers' },
                                        { label: 'Chỉ mình tôi', value: 'private' }
                                    ]}
                                    onChange={(v) => setFormData({...formData, privacy: v})}
                                />
                                <SelectGroup
                                    label="Giấy phép sử dụng"
                                    value={formData.license}
                                    options={[
                                        { label: 'Miễn phí', value: 'free' },
                                        { label: 'Premium', value: 'premium' }
                                    ]}
                                    onChange={(v) => setFormData({...formData, license: v})}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {step === 2 && (
                    <div className="p-4 border-t border-gray-100 flex gap-4 shrink-0 bg-white">
                        <button onClick={onClose}
                                className="flex-1 bg-[#d32f2f] text-white font-bold py-3 rounded-full hover:bg-[#b71c1c] transition-all font-utm">HỦY
                        </button>
                        <button onClick={handleSubmit} disabled={loading}
                                className="flex-1 bg-[#28a745] text-white font-bold py-3 rounded-full hover:bg-[#218838] transition-all font-utm disabled:opacity-50">
                            {loading ? "ĐANG LƯU..." : (editData ? "CẬP NHẬT" : "ĐĂNG")}
                        </button>
                    </div>
                )}
                {step === 1 && (
                    <div className="p-4 pt-0">
                        <button onClick={onClose} className="w-full text-gray-500 hover:text-black py-2 text-sm">Đóng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

interface InputGroupProps {
    label: string;
    placeholder?: string;
    value: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
}

const InputGroup = ({label, placeholder, value, onChange, disabled = false}: InputGroupProps) => (
    <div>
        <label className="block text-sm font-bold text-black mb-1 font-utm">{label}</label>
        <input type="text"
               disabled={disabled}
               className={`w-full bg-[#eee] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b9144] ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
               placeholder={placeholder}
               value={value}
               onChange={(e) => onChange && onChange(e.target.value)}/>
    </div>
);

interface OptionItem {
    label: string;
    value: string;
}

interface SelectGroupProps {
    label: string;
    value: string;
    options: (string | OptionItem)[];
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
            {options.map((opt) => {
                const isString = typeof opt === 'string';
                const val = isString ? opt : opt.value;
                const lbl = isString ? opt : opt.label;
                return <option key={val} value={val}>{lbl}</option>;
            })}
        </select>
    </div>
);