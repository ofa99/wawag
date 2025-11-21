"use client";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function InventoryPage() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            const unsub = onSnapshot(doc(db, "userItems", user.uid), (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    // Convert object { itemId: count } to array [{ name, count }]
                    // For now, since we don't have an item database, we'll just display the keys as names
                    const loadedItems = Object.entries(data).map(([key, value]) => ({
                        id: key,
                        name: key, // In real app, lookup name from 'items' collection
                        count: value,
                        icon: "🎒", // Default icon
                        type: "Item"
                    }));
                    setItems(loadedItems);
                } else {
                    setItems([]);
                }
                setLoading(false);
            });
            return () => unsub();
        }
    }, [user]);

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">My Bag</h1>
                <span className="bg-wawag-yellow/20 text-wawag-yellow-dark px-3 py-1 rounded-full text-sm font-bold">
                    {items.length} Items
                </span>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading bag... 🎒</div>
            ) : items.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="flex flex-col items-center p-4 space-y-3 hover:rotate-1 transition-transform cursor-pointer relative">
                                <div className="absolute top-2 right-2 bg-wawag-pink text-white text-xs font-bold px-2 py-1 rounded-full">
                                    x{item.count}
                                </div>
                                <div className="text-6xl filter drop-shadow-lg">{item.icon}</div>
                                <div className="text-center">
                                    <h3 className="font-bold text-gray-700 capitalize">{item.name}</h3>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">{item.type}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🕸️</div>
                    <p className="text-gray-500 font-bold">Your bag is empty!</p>
                    <p className="text-xs text-gray-400 mt-1">Visit the shop or events to get items.</p>
                </div>
            )}
        </div>
    );
}
