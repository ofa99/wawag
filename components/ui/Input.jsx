"use client";
import { cn } from "@/lib/utils";

export const Input = ({ className, ...props }) => {
    return (
        <input
            className={cn(
                "w-full px-5 py-4 rounded-2xl bg-wawag-cream border-2 border-transparent focus:border-wawag-pink focus:bg-white outline-none transition-all font-medium text-gray-600 placeholder-gray-300",
                className
            )}
            {...props}
        />
    );
};
