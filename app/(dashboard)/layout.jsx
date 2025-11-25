"use client";
import { Navbar } from "@/components/ui/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loading && !user) {
            const currentUrl = `${pathname}?${searchParams.toString()}`;
            router.push(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
        }
    }, [user, loading, router, pathname, searchParams]);

    if (loading) return null; // Or a loading spinner

    if (!user) return null;

    return (
        <div className="pb-24">
            {children}
            <Navbar />
        </div>
    );
}
