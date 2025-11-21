"use client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function GiftsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userPoints, setUserPoints] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!user) return;
                const token = await user.getIdToken();

                // Fetch Gifts
                const giftsRes = await fetch("/api/admin/get-gifts", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const giftsData = await giftsRes.json();
                setGifts(giftsData.gifts || []);

                // Fetch User Points (Optional, could get from context if available, but let's fetch fresh)
                // We don't have a direct "get-my-profile" API, but we can assume the context might be stale if points changed recently.
                // For now, let's rely on context or just fetch from a simple endpoint if we had one.
                // Actually, let's just use the context or maybe the 'get-users' API is too heavy.
                // Let's create a simple helper or just trust the redemption API to fail if points are low.
                // But showing points is good. Let's assume we can get it from a profile endpoint or just context.
                // Since I didn't update context to have live points, I'll just show what I have or maybe fetch?
                // Let's skip live points for now and just show the list.

            } catch (error) {
                console.error(error);
                toast.error("載入失敗");
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const handleRedeem = async (gift) => {
        if (!confirm(`確定要花費 ${gift.cost} 點兌換 "${gift.name}" 嗎？`)) return;

        const toastId = toast.loading("兌換中...");
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/redeem-gift", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ giftId: gift.id })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("兌換成功！已放入背包 🎒", { id: toastId });
                router.push("/inventory");
            } else {
                toast.error(data.error || "兌換失敗", { id: toastId });
            }
        } catch (error) {
            toast.error("發生錯誤", { id: toastId });
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <header>
                <h2 className="text-3xl font-black text-wawag-dark">點數兌換 🎁</h2>
                <p className="text-gray-500 font-medium">用您的點數換取精美禮品</p>
            </header>

            {loading ? (
                <div className="text-center py-12 text-gray-400">載入中... ⏳</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gifts.map((gift, index) => (
                        <motion.div
                            key={gift.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="bg-white border-gray-100 overflow-hidden h-full flex flex-col group hover:shadow-xl transition-all duration-300">
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                    <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-wawag-pink px-3 py-1 rounded-full text-sm font-black shadow-sm">
                                        {gift.cost.toLocaleString()} 點
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{gift.name}</h3>
                                    <div className="mt-auto pt-4">
                                        <Button
                                            className="w-full bg-wawag-blue text-white hover:bg-blue-400 shadow-blue-200 shadow-lg"
                                            onClick={() => handleRedeem(gift)}
                                        >
                                            立即兌換
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {gifts.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                            <p className="text-gray-400">目前沒有可兌換的禮物 🍃</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
