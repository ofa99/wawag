"use client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminGiftsPage() {
    const { user } = useAuth();
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newGift, setNewGift] = useState({ name: "", cost: "", image: null });
    const [uploading, setUploading] = useState(false);

    const fetchGifts = async () => {
        try {
            if (!user) return;
            const token = await user.getIdToken();
            // We can reuse a generic get-collection API or create a specific one.
            // Since we don't have a generic get-collection exposed, let's quickly create one or use a new route.
            // Actually, for now, let's assume we'll add a get-gifts route or just use client-side SDK for reading if rules allow?
            // The plan said "Admin APIs", so let's stick to API routes for consistency with Edge.
            // But wait, I didn't create a get-gifts route in the plan.
            // I'll create a simple one or just use the client SDK for reading since it's less critical than writing?
            // No, let's be consistent. I'll add a get-gifts route quickly or use a client-side fetch if I didn't plan it.
            // Actually, I can just use the client SDK for reading gifts since they are public read usually?
            // Let's check the rules. "allow read, write: if request.auth != null". So client SDK is fine for reading.

            // However, to avoid "Missing or insufficient permissions" if I mess up context, 
            // let's use an API route for consistency with the rest of the admin panel.
            // I'll create `app/api/admin/get-gifts/route.js` as well.

            const res = await fetch("/api/admin/get-gifts", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setGifts(data.gifts || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("載入禮物失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchGifts();
    }, [user]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setNewGift({ ...newGift, image: e.target.files[0] });
        }
    };

    const handleAddGift = async (e) => {
        e.preventDefault();
        if (!newGift.image) return toast.error("請上傳圖片");

        setUploading(true);
        const toastId = toast.loading("上傳圖片中...");

        try {
            // 1. Upload Image to Firebase Storage
            const storage = getStorage();
            const storageRef = ref(storage, `gifts/${Date.now()}_${newGift.image.name}`);
            await uploadBytes(storageRef, newGift.image);
            const imageUrl = await getDownloadURL(storageRef);

            toast.loading("建立禮物中...", { id: toastId });

            // 2. Create Gift Document via API
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/create-gift", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newGift.name,
                    cost: newGift.cost,
                    imageUrl
                })
            });

            if (res.ok) {
                toast.success("禮物建立成功！🎁", { id: toastId });
                setShowAddModal(false);
                setNewGift({ name: "", cost: "", image: null });
                fetchGifts();
            } else {
                const data = await res.json();
                toast.error(data.error || "建立失敗", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("發生錯誤", { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteGift = async (giftId) => {
        if (!confirm("確定要刪除這個禮物嗎？")) return;
        const toastId = toast.loading("刪除中...");

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/delete-gift", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ giftId })
            });

            if (res.ok) {
                toast.success("已刪除", { id: toastId });
                setGifts(gifts.filter(g => g.id !== giftId));
            } else {
                toast.error("刪除失敗", { id: toastId });
            }
        } catch (error) {
            toast.error("發生錯誤", { id: toastId });
        }
    };

    return (
        <div className="space-y-6 relative">
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-black text-wawag-dark mb-4">新增禮物 🎁</h2>
                            <form onSubmit={handleAddGift} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">禮物圖片</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">禮物名稱</label>
                                    <Input
                                        required
                                        value={newGift.name}
                                        onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                                        placeholder="e.g. 馬卡龍禮盒"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">兌換點數</label>
                                    <Input
                                        type="number"
                                        required
                                        value={newGift.cost}
                                        onChange={(e) => setNewGift({ ...newGift, cost: e.target.value })}
                                        placeholder="e.g. 500"
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>取消</Button>
                                    <Button type="submit" disabled={uploading} className="flex-1 bg-wawag-blue text-white hover:bg-blue-400">
                                        {uploading ? "處理中..." : "新增禮物"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-wawag-dark">禮物管理 🎁</h2>
                    <p className="text-gray-500 font-medium">設定可供兌換的獎品</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>新增禮物</Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gifts.map(gift => (
                    <Card key={gift.id} className="bg-white border-gray-100 overflow-hidden group">
                        <div className="aspect-video bg-gray-100 relative overflow-hidden">
                            <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md">
                                {gift.cost.toLocaleString()} 點
                            </div>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <div className="font-bold text-gray-800">{gift.name}</div>
                            <Button variant="ghost" className="text-red-400 hover:bg-red-50 hover:text-red-500" onClick={() => handleDeleteGift(gift.id)}>
                                刪除
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
