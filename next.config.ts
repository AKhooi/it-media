import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {protocol: 'https', hostname: 'lh3.googleusercontent.com'}, // Cho ảnh Google Drive
            {protocol: 'https', hostname: 'drive.google.com'},          // Cho link Google Drive
        ],
    },
};

export default nextConfig;
