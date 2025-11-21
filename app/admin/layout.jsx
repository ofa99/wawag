"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminErrorBoundary } from "./ErrorBoundary";

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
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    // Hardcoded for client-side check (Fallback)
    const ADMIN_EMAILS = ["abc@gmail.com", "allenlu@example.com"];

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (loading) return;

            if (!user) {
                if (pathname !== "/admin/login") {
                    router.push("/admin/login");
                }
                setChecking(false);
                return;
            }

            try {
                // 1. Check Hardcoded List first (Fastest)
                if (ADMIN_EMAILS.includes(user.email)) {
                    setIsAuthorized(true);
                    setChecking(false);
                    return;
                }

                // 2. Check Firestore Profile
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.isAdmin === true) {
                        setIsAuthorized(true);
                        setChecking(false);
                        return;
                    }
                }

                // Not authorized
                toast.error("未經授權的存取");
                router.push("/dashboard");
                setChecking(false);
            } catch (e) {
                console.error("Admin Check Error:", e);
                // On error, deny access unless in hardcoded list
                if (ADMIN_EMAILS.includes(user?.email)) {
                    setIsAuthorized(true);
                } else {
                    toast.error("驗證失敗，請重新登入");
                    router.push("/admin/login");
                }
                setChecking(false);
            }
        };

        checkAdminStatus();
    }, [user, loading, pathname]); // Removed router from dependencies

    if (loading || checking) return <div className="min-h-screen flex items-center justify-center">載入後台...</div>;

    // If on login page, render without sidebar
    if (pathname === "/admin/login") {
        return children;
    }

    if (!isAuthorized) return null;

    return (
        <AdminErrorBoundary>
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
        </AdminErrorBoundary>
    );
}
