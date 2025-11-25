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

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [redeemedGift, setRedeemedGift] = useState(null);

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
                toast.dismiss(toastId);
                setRedeemedGift(gift);
                setShowSuccessModal(true);
                // Update local stock if needed, or just let it refresh on next visit
                // Optimistic update for better UX
                setGifts(prev => prev.map(g =>
                    g.id === gift.id && g.stock !== undefined
                        ? { ...g, stock: g.stock - 1 }
                        : g
                ));
            } else {
                toast.error(data.error || "兌換失敗", { id: toastId });
            }
        } catch (error) {
            toast.error("發生錯誤", { id: toastId });
        }
    };

    return (
        <div className="space-y-6 pb-24 relative">
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
                                    {gift.stock !== undefined && (
                                        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            剩餘: {gift.stock}
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{gift.name}</h3>
                                    <div className="mt-auto pt-4">
                                        <Button
                                            className={`w-full text-white shadow-lg ${gift.stock !== undefined && gift.stock <= 0
                                                    ? "bg-gray-300 cursor-not-allowed shadow-none"
                                                    : "bg-wawag-blue hover:bg-blue-400 shadow-blue-200"
                                                }`}
                                            disabled={gift.stock !== undefined && gift.stock <= 0}
                                            onClick={() => handleRedeem(gift)}
                                        >
                                            {gift.stock !== undefined && gift.stock <= 0 ? "已兌換完畢" : "立即兌換"}
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

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-wawag-yellow/20 to-transparent pointer-events-none" />

                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                className="text-6xl mb-4 relative z-10"
                            >
                                🎁
                            </motion.div>

                            <h2 className="text-2xl font-black text-wawag-purple mb-2 relative z-10">兌換成功！</h2>
                            <p className="text-gray-500 font-medium mb-6 relative z-10">
                                您已獲得 <span className="text-wawag-pink font-bold">{redeemedGift?.name}</span>
                            </p>

                            <div className="flex gap-3 relative z-10">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowSuccessModal(false)}
                                >
                                    繼續兌換
                                </Button>
                                <Button
                                    className="flex-1 bg-wawag-blue text-white hover:bg-blue-400"
                                    onClick={() => router.push("/inventory")}
                                >
                                    查看背包
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
