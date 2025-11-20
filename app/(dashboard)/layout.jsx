"use client";
import { Navbar } from "@/components/ui/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) return null; // Or a loading spinner

    if (!user) return null;

    return (
        <div className="pb-24">
            {children}
            <Navbar />
        </div>
    );
}
