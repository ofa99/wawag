"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Card = ({ children, className, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "glass-card rounded-3xl p-6",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
