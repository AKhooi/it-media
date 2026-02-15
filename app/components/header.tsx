import Link from "next/link";

export default function Header() {
    return (
        <header className="bg-[#4b9144] px-4 py-3 shadow-md">
            <div className="container mx-auto flex items-center justify-between gap-4">

                {/* Logo */}
                <Link href="/">
                    <div className="text-white font-family font-bold text-xl md:text-2xl tracking-tighter shrink-0">
                        designnonglam
                    </div>
                </Link>
                {/* Search Bar */}
                <div className="flex-grow max-w-2xl relative">
                    <input
                        type="text"
                        className="w-full pl-4 pr-10 py-2 rounded-full border-none focus:outline-none focus:ring-2 bg-white"
                    />
                    <button
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-[#999] rounded-full text-white hover:bg-gray-600 transition">
                        {/* Icon Search SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}
                             stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                        </svg>
                    </button>
                </div>

                {/* User Icon */}
                <Link href="/login" className="text-white shrink-0 hover:opacity-80 transition">
                    {/* Icon User SVG giữ nguyên */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9">
                        <path fillRule="evenodd"
                              d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                              clipRule="evenodd"/>
                    </svg>
                </Link>
            </div>
        </header>
    )
}