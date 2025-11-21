"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

function RedeemContent() {
    const searchParams = useSearchParams();
    const codeId = searchParams.get("codeId");
    const router = useRouter();
    const { user, loading } = useAuth();

    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("驗證代碼中...");
    const [points, setPoints] = useState(0);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            // Redirect to login with return URL if not logged in
            router.push(`/login?redirect=/redeem?codeId=${codeId}`);
            return;
        }

        if (!codeId) {
            setStatus("error");
            setMessage("無效連結：缺少代碼 ID");
            return;
        }

        const redeemCode = async () => {
            try {
                const res = await fetch("/api/claim-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ codeId, uid: user.uid })
                });

                const data = await res.json();

                if (data.success) {
                    setStatus("success");
                    setPoints(data.points);
                    toast.success(`太棒了！獲得 +${data.points} 點！🎉`);
                } else {
                    setStatus("error");
                    setMessage(data.message || "兌換代碼失敗");
                }
            } catch (error) {
                setStatus("error");
                setMessage("發生錯誤，請稍後再試。");
            }
        };

        redeemCode();
    }, [codeId, user, loading, router]);

    return (
        <div className="min-h-screen bg-wawag-cream flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
            >
                <Card className="p-8 text-center bg-white/90 backdrop-blur-xl shadow-2xl border-4 border-white">
                    {status === "verifying" && (
                        <div className="space-y-4">
                            <div className="animate-spin text-4xl">⏳</div>
                            <h2 className="text-xl font-bold text-gray-500">驗證代碼中...</h2>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-8xl"
                            >
                                🎉
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-black text-wawag-pink mb-2">兌換成功！</h1>
                                <p className="text-gray-600 font-medium">
                                    您已獲得 <span className="text-wawag-purple font-bold text-xl">+{points} 點</span>
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="w-full bg-wawag-green text-white hover:bg-green-400 shadow-lg shadow-green-200"
                            >
                                回首頁 🏠
                            </Button>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="space-y-6">
                            <motion.div
                                initial={{ rotate: 0 }}
                                animate={{ rotate: [0, 10, -10, 0] }}
                                className="text-8xl"
                            >
                                🥺
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-400 mb-2">糟糕！</h1>
                                <p className="text-red-400 font-bold bg-red-50 py-2 px-4 rounded-xl inline-block">
                                    {message}
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="w-full bg-gray-400 text-white hover:bg-gray-500"
                            >
                                回首頁 🏠
                            </Button>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}

export default function RedeemPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RedeemContent />
        </Suspense>
    );
}
