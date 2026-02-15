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
}

export default function BannerCarousel({ images, delay = 3000 }: BannerCarouselProps) {
    return (
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition relative group">
            <Swiper
                spaceBetween={0}
                effect={'fade'} // Hiệu ứng mờ dần (sang hơn kiểu trượt ngang)
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
                    <SwiperSlide key={index} className="relative w-full h-full">
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