export default function Footer() {
    return (
        <footer className="bg-[#5ea152] text-white pt-10 pb-6 mt-auto border-t-4 border-[#4b8240]">
            <div className="container mx-auto px-4">

                {/* --- PHẦN 1: GRID NỘI DUNG --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

                    {/* Cột 1: Logo & Giới thiệu */}
                    <div className="md:col-span-1">
                        <div className="text-2xl font-black tracking-tighter uppercase mb-3">
                            designnonglam
                        </div>
                        <p className="text-green-50 text-sm leading-relaxed mb-4">
                            Nền tảng chia sẻ tài nguyên đồ họa.
                        </p>
                    </div>

                    {/* Cột 2: Liên hệ */}
                    <div>
                        <h3 className="font-bold --main-font text-lg mb-4 uppercase tracking-wide">Liên hệ</h3>
                        <ul className="space-y-2 text-sm text-green-50">
                            <li className="flex flex-wrap items-center gap-2">
                                <span className="opacity-70">Email:</span>
                                <a href="mailto:doankhoacongnghethongtin@hcmuaf.edu.vn" className="hover:text-white hover:underline">doankhoacongnghethongtin@hcmuaf.edu.vn</a>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="opacity-70">Zalo:</span>
                                <span className="hover:text-white">0987.654.321</span>
                            </li>
                            <li className="opacity-70">
                                KP33, Phường Linh Xuân, TP.HCM
                            </li>
                        </ul>
                    </div>

                    {/* Cột 3: Hỗ trợ */}
                    <div>
                        <h3 className="--main-font font-bold text-lg mb-4 uppercase tracking-wide">Hỗ trợ</h3>
                        <ul className="space-y-2 text-sm text-green-50">
                            <li><a href="#" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Hướng dẫn tải tài nguyên</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Chính sách bảo mật</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Điều khoản sử dụng</a></li>
                            <li><a href="#" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Báo lỗi link hỏng</a></li>
                        </ul>
                    </div>

                    {/* Cột 4: Mạng xã hội (Socials) */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 uppercase tracking-wide">Kết nối</h3>
                        <div className="flex gap-3">

                            {/* 1. Facebook Icon */}
                            <a target="_blank" href="https://www.facebook.com/dhkcntt.nlu" className="w-10 h-10 rounded-full bg-[#4b8240] flex items-center justify-center hover:bg-white hover:text-[#1877F2] transition-all duration-300 shadow-md group" aria-label="Facebook">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                </svg>
                            </a>

                            {/* 2. YouTube Icon */}
                            <a target="_blank" href="https://www.youtube.com/@Doan-HoiKhoaCNTT-NLU" className="w-10 h-10 rounded-full bg-[#4b8240] flex items-center justify-center hover:bg-white hover:text-[#FF0000] transition-all duration-300 shadow-md group" aria-label="YouTube">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                </svg>
                            </a>

                            {/* 3. Gmail Icon */}
                            <a href="mailto:doankhoacongnghethongtin@hcmuaf.edu.vn" className="w-10 h-10 rounded-full bg-[#4b8240] flex items-center justify-center hover:bg-white hover:text-[#EA4335] transition-all duration-300 shadow-md group" aria-label="Gmail">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819v-5.818l-5.454 3.454-1.091-1.091-5.454-3.454v5.818h-3.819c-.904 0-1.636-.732-1.636-1.636v-13.909c0-.904.732-1.636 1.636-1.636h3.819l6.545 4.909 6.545-4.909h3.819c.904 0 1.636.732 1.636 1.636zm-5.455 1.636-6.545 4.909-6.545-4.909v-.545l6.545 4.909 6.545-4.909v.545z"/>
                                </svg>
                            </a>

                        </div>
                    </div>

                </div>

                {/* --- PHẦN 2: COPYRIGHT BAR --- */}
                <div className="border-t border-green-400/30 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-green-100 opacity-80">
                    <div className="mb-2 md:mb-0">
                        &copy; {new Date().getFullYear()} DesignNongLam - All rights reserved.
                    </div>
                    <div>
                        Designed with ❤️ by Anh Khôi
                    </div>
                </div>

            </div>
        </footer>
    );
}