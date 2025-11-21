"use client";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function InventoryPage() {
    const { user } = useAuth();
    const [legacyItems, setLegacyItems] = useState([]);
    const [giftItems, setGiftItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Listen to Legacy Items (userItems/{uid})
    useEffect(() => {
        if (user?.uid) {
            const unsub = onSnapshot(doc(db, "userItems", user.uid), (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    const items = Object.entries(data).map(([key, value]) => ({
                        id: `legacy-${key}`,
                        name: key,
                        count: value,
                        icon: "🎒",
                        type: "物品",
                        imageUrl: null
                    }));
                    setLegacyItems(items);
                } else {
                    setLegacyItems([]);
                }
            });
            return () => unsub();
        }
    }, [user]);

    // 2. Fetch Redeemed Gifts (inventory collection)
    useEffect(() => {
        const fetchGifts = async () => {
            if (!user?.uid) return;
            try {
                const q = query(collection(db, "inventory"), where("userId", "==", user.uid));
                const querySnapshot = await getDocs(q);

                // Group by giftId to show counts
                const giftCounts = {};
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!giftCounts[data.giftId]) {
                        giftCounts[data.giftId] = {
                            id: data.giftId,
                            name: data.name,
                            count: 0,
                            icon: "🎁",
                            type: "禮物",
                            imageUrl: data.imageUrl
                        };
                    }
                    giftCounts[data.giftId].count += 1;
                });

                setGiftItems(Object.values(giftCounts));
            } catch (error) {
                console.error("Error fetching gifts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGifts();
    }, [user]);

    const allItems = [...legacyItems, ...giftItems];

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">我的背包</h1>
                <span className="bg-wawag-yellow/20 text-wawag-yellow-dark px-3 py-1 rounded-full text-sm font-bold">
                    {allItems.length} 個物品
                </span>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">載入背包中... 🎒</div>
            ) : allItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="flex flex-col items-center p-4 space-y-3 hover:rotate-1 transition-transform cursor-pointer relative overflow-hidden group">
                                <div className="absolute top-2 right-2 bg-wawag-pink text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                                    x{item.count}
                                </div>

                                <div className="w-20 h-20 flex items-center justify-center bg-gray-50 rounded-full mb-2 overflow-hidden">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl filter drop-shadow-sm">{item.icon}</div>
                                    )}
                                </div>

                                <div className="text-center z-10">
                                    <h3 className="font-bold text-gray-700 capitalize line-clamp-1">{item.name}</h3>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">{item.type}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🕸️</div>
                    <p className="text-gray-500 font-bold">背包是空的！</p>
                    <p className="text-xs text-gray-400 mt-1">去商店或參加活動來獲取物品。</p>
                </div>
            )}
        </div>
    );
}
