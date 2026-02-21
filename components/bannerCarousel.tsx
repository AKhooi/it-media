'use client'; // Bắt buộc vì dùng hiệu ứng động

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import Image from 'next/image';

// Import CSS của Swiper
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

interface BannerCarouselProps {
    images: string[];
    delay?: number; // Tốc độ chạy slide
    onImageClick?: (index: number) => void; // 🌟 1. THÊM DÒNG NÀY ĐỂ NHẬN SỰ KIỆN CLICK
}

// 🌟 2. KHAI BÁO THÊM onImageClick VÀO TRONG HÀM
export default function BannerCarousel({ images, delay = 3000, onImageClick }: BannerCarouselProps) {
    return (
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition relative group">
            <Swiper
                key={images.length}
                spaceBetween={0}
                effect={'fade'} // Hiệu ứng mờ dần (sang hơn kiểu trượt ngang)
                speed={1000}
                observer={true} // 🌟 3. Báo cho Swiper biết nếu HTML bên trong thay đổi thì tự update
                observeParents={true}
                centeredSlides={true}
                loop={true} // Chạy vòng lặp vô tận
                autoplay={{
                    delay: delay,
                    disableOnInteraction: false, // Người dùng chạm vào vẫn chạy tiếp
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: true, // Chấm tròn nhỏ gọn
                }}
                modules={[Autoplay, EffectFade, Pagination]}
                className="w-full h-full"
            >
                {images.map((src, index) => (
                    <SwiperSlide
                        key={index}
                        // 🌟 3. THÊM SỰ KIỆN CLICK VÀ CON TRỎ CHUỘT (cursor-pointer) VÀO TỪNG SLIDE
                        onClick={() => onImageClick && onImageClick(index)}
                        className="relative w-full h-full cursor-pointer"
                    >
                        {/* Dùng Next/Image với chế độ fill để ảnh tự co giãn đầy khung */}
                        <Image
                            src={src}
                            alt={`Banner ${index}`}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105" // Hover vào ảnh phóng to nhẹ
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={index === 0} // Ưu tiên tải ảnh đầu tiên
                        />

                        {/* Lớp phủ đen mờ nhẹ để chữ (nếu có) nổi hơn */}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}