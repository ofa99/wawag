"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

const adminNavItems = [
    { name: "會員管理", href: "/admin/users", icon: "👥" },
    { name: "點數紀錄", href: "/admin/points", icon: "📊" },
    { name: "禮物管理", href: "/admin/gifts", icon: "🎁" },
    { name: "QR Code", href: "/admin/qrcode", icon: "🎟️" },
    { name: "返回前台", href: "/dashboard", icon: "🏠" },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const router = useRouter();

    // Hardcoded for client-side check
    const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

    useEffect(() => {
        if (!loading) {
            if (!user) {
                if (pathname !== "/admin/login") {
                    router.push("/admin/login");
                }
            } else {
                if (!ADMIN_EMAILS.includes(user.email)) {
                    toast.error("未經授權的存取");
                    router.push("/dashboard");
                }
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">載入後台...</div>;

    // If on login page, render without sidebar
    if (pathname === "/admin/login") {
        return children;
    }

    if (!user || !ADMIN_EMAILS.includes(user.email)) return null;

    return (
        <div className="min-h-screen bg-wawag-cream flex flex-col md:flex-row">
            {/* Mobile/Desktop Sidebar/Header */}
            <aside className="bg-white/80 backdrop-blur-xl border-r border-white/50 w-full md:w-64 flex-shrink-0 z-20">
                <div className="p-6 bg-wawag-pink-light">
                    <h1 className="text-2xl font-black text-wawag-dark tracking-tight">管理員後台 🛠️</h1>
                    <p className="text-xs text-wawag-purple font-bold mt-1">馬卡龍管理員</p>
                </div>
                <nav className="p-4 space-y-2">
                    {adminNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href}>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-wawag-pink text-white shadow-lg shadow-wawag-pink/30" : "hover:bg-gray-50 text-gray-600"}`}>
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-bold">{item.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
