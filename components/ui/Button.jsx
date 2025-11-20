"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Button = ({ children, className, variant = "primary", ...props }) => {
    const variants = {
        primary: "bg-wawag-pink text-white shadow-lg shadow-wawag-pink/30 hover:bg-wawag-pink/90",
        secondary: "bg-wawag-blue text-white shadow-lg shadow-wawag-blue/30 hover:bg-wawag-blue/90",
        yellow: "bg-wawag-yellow text-wawag-dark shadow-lg shadow-wawag-yellow/30 hover:bg-wawag-yellow-dark",
        outline: "border-2 border-wawag-pink text-wawag-pink bg-transparent hover:bg-wawag-pink/10",
        ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "px-6 py-3 rounded-2xl font-bold transition-all active:scale-95",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
};
