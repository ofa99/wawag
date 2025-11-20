"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
    { name: "Home", href: "/dashboard", icon: "🏠" },
    { name: "Transfer", href: "/transfer", icon: "💸" },
    { name: "Collect", href: "/events/letters", icon: "🔠" },
    { name: "Bag", href: "/inventory", icon: "🎒" },
];

export const Navbar = () => {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
            <div className="glass-card rounded-full p-2 flex justify-between items-center shadow-2xl border-white/50 bg-white/70 backdrop-blur-md">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href} className="relative flex-1 flex justify-center py-3">
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-wawag-pink rounded-full m-1"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className={`text-2xl relative z-10 transition-colors ${isActive ? "text-white" : "opacity-60 grayscale"}`}>
                                {item.icon}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
