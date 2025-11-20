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
    const [message, setMessage] = useState("Verifying code...");
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
            setMessage("Invalid Link: Missing Code ID");
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
                    toast.success(`Yay! +${data.points} Points! 🎉`);
                } else {
                    setStatus("error");
                    setMessage(data.message || "Failed to redeem code");
                }
            } catch (error) {
                setStatus("error");
                setMessage("Something went wrong. Please try again.");
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
                            <h2 className="text-xl font-bold text-gray-500">Verifying Code...</h2>
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
                                <h1 className="text-3xl font-black text-wawag-pink mb-2">Success!</h1>
                                <p className="text-gray-600 font-medium">
                                    You've collected <span className="text-wawag-purple font-bold text-xl">+{points} Points</span>
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="w-full bg-wawag-green text-white hover:bg-green-400 shadow-lg shadow-green-200"
                            >
                                Go to Dashboard 🏠
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
                                <h1 className="text-3xl font-black text-gray-400 mb-2">Oops!</h1>
                                <p className="text-red-400 font-bold bg-red-50 py-2 px-4 rounded-xl inline-block">
                                    {message}
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="w-full bg-gray-400 text-white hover:bg-gray-500"
                            >
                                Back Home 🏠
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
