"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const ProgressBar = ({ value, max, className, color = "bg-wawag-pink" }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={cn("h-4 bg-white/50 rounded-full overflow-hidden p-1", className)}>
            <motion.div
                className={cn("h-full rounded-full", color)}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
            />
        </div>
    );
};
