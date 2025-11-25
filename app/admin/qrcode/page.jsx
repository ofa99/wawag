"use client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminQRCodePage() {
    const { user } = useAuth();
    const [points, setPoints] = useState(100);
    const [loading, setLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState(null);
    const [history, setHistory] = useState([]);

    // Real-time History Subscription
    useEffect(() => {
        const q = query(collection(db, "codes"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const codes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Handle Timestamp objects
                createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
                usedAt: doc.data().usedAt?.toDate().toISOString() || null
            }));
            setHistory(codes);
        });

        return () => unsubscribe();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGeneratedCode(null);

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/generate-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ points: Number(points) }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`成功產生代碼！\n${data.codeId}`);
                setPoints("");
                setGeneratedCode(data);
            } else {
                console.error("Generate failed:", data);
                toast.error(`產生失敗: ${data.error || "未知錯誤"}`);
            }
        } catch (error) {
            console.error(error);
            toast.error(`發生錯誤: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("確定要刪除此代碼嗎？")) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/admin/delete-code?id=${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success("代碼已刪除");
            } else {
                toast.error("刪除失敗");
            }
        } catch (error) {
            toast.error("刪除代碼時發生錯誤");
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-black text-wawag-dark">QR Code 產生器 🎟️</h2>
                <p className="text-gray-500 font-medium">為實體活動建立點數代碼</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generator Section */}
                <Card className="lg:col-span-1 bg-white/80 border-white/50 backdrop-blur-xl shadow-xl h-fit">
                    <h3 className="text-xl font-bold text-wawag-purple mb-4">新代碼</h3>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">點數價值</label>
                            <Input
                                type="number"
                                min="1"
                                value={points}
                                onChange={(e) => setPoints(e.target.value)}
                                className="font-mono text-lg"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-wawag-pink hover:bg-pink-400 text-white shadow-lg shadow-pink-200"
                            disabled={loading}
                        >
                            {loading ? "產生中..." : "產生 QR Code ✨"}
                        </Button>
                    </form>

                    {generatedCode && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 p-4 bg-wawag-cream rounded-2xl border-2 border-dashed border-wawag-yellow flex flex-col items-center"
                        >
                            <div className="bg-white p-2 rounded-xl shadow-sm mb-3">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://wawag.pages.dev/scan?code=${generatedCode.codeId}`)}`}
                                    alt="QR Code"
                                    className="w-32 h-32"
                                />
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-wawag-dark">{generatedCode.points} 點</div>
                                <div className="font-mono text-xs text-gray-500 bg-white px-2 py-1 rounded mt-1 select-all">
                                    {generatedCode.codeId}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </Card>

                {/* History Section */}
                <Card className="lg:col-span-2 bg-white/80 border-white/50 backdrop-blur-xl shadow-xl">
                    <h3 className="text-xl font-bold text-wawag-blue mb-4">歷史紀錄</h3>

                    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-wawag-cream text-gray-500 text-xs uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-4">代碼 ID</th>
                                    <th className="p-4">點數</th>
                                    <th className="p-4">狀態</th>
                                    <th className="p-4">建立時間</th>
                                    <th className="p-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono font-bold text-gray-700">{item.codeId}</td>
                                        <td className="p-4 font-bold text-wawag-pink">+{item.points}</td>
                                        <td className="p-4">
                                            {item.isUsed ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                                                    已使用
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                                    有效
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-gray-400">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            {!item.isUsed && (
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-400 hover:text-red-600 text-xs font-bold hover:underline"
                                                >
                                                    刪除
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {history.length === 0 && (
                            <div className="p-8 text-center text-gray-400">尚無歷史紀錄</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
