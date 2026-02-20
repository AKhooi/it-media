'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface Category { id: string; name: string; isActive: boolean; }
interface Tag { id: string; name: string; }

interface UploadFormData {
    title: string;
    description: string;
    fileURL: string;
    image: string;
    tags: string;
    formatFile: string;
    privacy: string;
    license: string;
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

export default function UploadModal({ isOpen, onClose, editData }: UploadModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);

    const [formData, setFormData] = useState<UploadFormData>({
        title: '', description: '', fileURL: '', image: '', tags: '', formatFile: '', privacy: 'Công khai', license: 'Miễn phí'
    });

    // EFFECT 1: Lấy danh sách Category
    useEffect(() => {
        const fetchCategories = async () => {
            if (!isOpen) return;
            try {
                const q = query(collection(db, "categories"), where("isActive", "==", true));
                const querySnapshot = await getDocs(q);
                const cats: Category[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
                setCategories(cats);

                // --- XỬ LÝ CHẾ ĐỘ EDIT ---
                if (editData) {
                    setFormData({
                        title: editData.title || '',
                        description: editData.description || '',
                        fileURL: editData.fileURL || '',
                        // Khôi phục lại link drive gốc cho user thấy dễ chịu
                        image: editData.image ? `https://drive.google.com/file/d/${editData.image}/view` : '',
                        tags: editData.tags ? editData.tags.join(', ') : '',
                        formatFile: editData.formatFile || '',
                        privacy: editData.privacy || 'Công khai',
                        license: editData.license || 'Miễn phí'
                    });

                    // Gán Category dựa trên categoryId cũ
                    const foundCat = cats.find(c => c.id === editData.categoryId);
                    if (foundCat) setSelectedCategory(foundCat);

                    setStep(2); // Nhảy thẳng vào bước sửa
                } else {
                    // RESET chế độ Add mới
                    setStep(1);
                    setFormData({ title: '', description: '', fileURL: '', image: '', tags: '', formatFile: '', privacy: 'Công khai', license: 'Miễn phí' });
                    setSelectedCategory(null);
                }

            } catch (error) { console.error("Lỗi lấy danh mục:", error); }
        };
        fetchCategories();
    }, [isOpen, editData]);

    // EFFECT 2: Lấy Tags gợi ý
    useEffect(() => {
        const fetchTagsByCategory = async () => {
            if (step !== 2 || !selectedCategory) return;
            setLoadingTags(true);
            try {
                const q = query(collection(db, "tags"), where("categoryID", "==", selectedCategory.id));
                const querySnapshot = await getDocs(q);
                const tags: Tag[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as { name: string }) }));
                setSuggestedTags(tags);
            } catch (error) { console.error("Lỗi lấy tags:", error); }
            finally { setLoadingTags(false); }
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

            // --- XỬ LÝ TAGS ---
            const inputTagNames = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
            const finalTagIDs: string[] = [];

            for (const tagName of inputTagNames) {
                const existingTag = suggestedTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
                if (existingTag) {
                    finalTagIDs.push(existingTag.id);
                } else {
                    const newTagRef = await addDoc(collection(db, "tags"), {
                        name: tagName,
                        categoryID: selectedCategory?.id,
                        isActive: true
                    });
                    finalTagIDs.push(newTagRef.id);
                }
            }

            // --- PHÂN NHÁNH: UPDATE HAY ADD? ---
            if (editData && editData.id) {
                // CHẾ ĐỘ UPDATE
                const docRef = doc(db, "resources", editData.id);
                await updateDoc(docRef, {
                    ...formData,
                    image: imageID,
                    tags: finalTagIDs, // Lưu mảng ID mới
                    categoryId: selectedCategory?.id // Lỡ user đổi category thì sao (hiện tại UI chưa cho đổi, nhưng phòng hờ)
                    // Không update: userId, createdAt, views, downloads
                });
                alert("Cập nhật bài viết thành công!");
            } else {
                // CHẾ ĐỘ THÊM MỚI
                await addDoc(collection(db, "resources"), {
                    ...formData,
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

            onClose(); // Đóng modal
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
        setFormData({ ...formData, tags: newTags });
    };

    if (!isOpen) return null;

    return (
        // UI giữ nguyên không thay đổi
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
                                <button key={cat.id} onClick={() => handleSelectCategory(cat)} className="bg-[#1b4d24] text-white font-bold font-utm py-4 rounded-xl hover:bg-[#143d1c] hover:scale-105 transition-all shadow-md uppercase">{cat.name}</button>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col gap-4">
                            <InputGroup label="Link Drive/Canva thiết kế" placeholder="Dán link tài nguyên vào đây..." value={formData.fileURL} onChange={(v) => setFormData({...formData, fileURL: v})} />
                            <InputGroup label="Link Thumbnail (Ảnh mô tả)" placeholder="Dán link ảnh hiển thị..." value={formData.image} onChange={(v) => setFormData({...formData, image: v})} />
                            <InputGroup label="Tiêu đề" placeholder="VD: Poster Mùa Hè Xanh 2026..." value={formData.title} onChange={(v) => setFormData({...formData, title: v})} />
                            <div>
                                <label className="block text-sm font-bold text-black mb-1 font-utm">Mô tả chi tiết</label>
                                <textarea className="w-full bg-[#eee] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b9144] min-h-[100px]" placeholder="Mô tả về thiết kế của bạn..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <InputGroup label="Danh mục" value={selectedCategory?.name || ''} disabled={true} />
                                <InputGroup label="Định dạng File" placeholder="PSD, AI, PPTX..." value={formData.formatFile} onChange={(v) => setFormData({...formData, formatFile: v})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 font-utm">Gợi ý từ khóa:</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {suggestedTags.map((tag) => (
                                        <button key={tag.id} onClick={() => handleAddTag(tag.name)} className="px-3 py-1 bg-gray-200 hover:bg-[#4b9144] hover:text-white text-xs rounded-full transition-colors border border-gray-300">+ {tag.name}</button>
                                    ))}
                                </div>
                                <InputGroup label="Thẻ / Từ khóa (Cách nhau dấu phẩy)" placeholder="muahe, tinhnguyen, poster..." value={formData.tags} onChange={(v) => setFormData({...formData, tags: v})} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <SelectGroup label="Quyền riêng tư" value={formData.privacy} options={['Công khai', 'Chỉ mình tôi']} onChange={(v) => setFormData({...formData, privacy: v})} />
                                <SelectGroup label="Giấy phép sử dụng" value={formData.license} options={['Miễn phí', 'Có phí']} onChange={(v) => setFormData({...formData, license: v})} />
                            </div>
                        </div>
                    )}
                </div>

                {step === 2 && (
                    <div className="p-4 border-t border-gray-100 flex gap-4 shrink-0 bg-white">
                        <button onClick={onClose} className="flex-1 bg-[#d32f2f] text-white font-bold py-3 rounded-full hover:bg-[#b71c1c] transition-all font-utm">HỦY</button>
                        <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#28a745] text-white font-bold py-3 rounded-full hover:bg-[#218838] transition-all font-utm disabled:opacity-50">
                            {loading ? "ĐANG LƯU..." : (editData ? "CẬP NHẬT" : "ĐĂNG")}
                        </button>
                    </div>
                )}
                {step === 1 && (
                    <div className="p-4 pt-0">
                        <button onClick={onClose} className="w-full text-gray-500 hover:text-black py-2 text-sm">Đóng</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// InputGroup & SelectGroup giữ nguyên code cũ của bạn
interface InputGroupProps { label: string; placeholder?: string; value: string; onChange?: (value: string) => void; disabled?: boolean; }
const InputGroup = ({ label, placeholder, value, onChange, disabled = false }: InputGroupProps) => (
    <div><label className="block text-sm font-bold text-black mb-1 font-utm">{label}</label><input type="text" disabled={disabled} className={`w-full bg-[#eee] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b9144] ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} placeholder={placeholder} value={value} onChange={(e) => onChange && onChange(e.target.value)} /></div>
);
interface SelectGroupProps { label: string; value: string; options: string[]; onChange: (value: string) => void; }
const SelectGroup = ({ label, value, options, onChange }: SelectGroupProps) => (
    <div><label className="block text-sm font-bold text-black mb-1 font-utm">{label}</label><select className="w-full bg-[#eee] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b9144] appearance-none" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select></div>
);