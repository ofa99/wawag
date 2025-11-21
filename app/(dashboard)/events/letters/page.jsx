"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function LettersPage() {
    const { user } = useAuth();
    const [letters, setLetters] = useState({});
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawnLetter, setDrawnLetter] = useState(null);

    useEffect(() => {
        if (user?.uid) {
            const unsub = onSnapshot(doc(db, "userLetters", user.uid), (doc) => {
                setLetters(doc.data() || {});
            });
            return () => unsub();
        }
    }, [user]);

    const drawLetter = async () => {
        setIsDrawing(true);
        setDrawnLetter(null);
        try {
            const res = await fetch("/api/drawLetter", {
                method: "POST",
                body: JSON.stringify({ uid: user.uid }),
            });
            const data = await res.json();

            if (res.ok) {
                setTimeout(() => {
                    setDrawnLetter(data.letter);
                    setIsDrawing(false);
                }, 1000); // Fake delay for suspense
            } else {
                toast.error(data.error);
                setIsDrawing(false);
            }
        } catch (e) {
            toast.error("抽取失敗");
            setIsDrawing(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto space-y-6 text-center">
            <h1 className="text-2xl font-black text-wawag-pink">收集字母 🔠</h1>

            <div className="bg-white/40 p-4 rounded-2xl">
                <p className="text-sm font-bold text-gray-600 mb-2">您的收藏</p>
                <div className="flex justify-center gap-4 text-2xl font-black">
                    <div className="flex flex-col">
                        <span className="text-wawag-pink">W</span>
                        <span className="text-sm text-gray-500">x{letters.W || 0}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-wawag-blue">A</span>
                        <span className="text-sm text-gray-500">x{letters.A || 0}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-wawag-yellow-dark">G</span>
                        <span className="text-sm text-gray-500">x{letters.G || 0}</span>
                    </div>
                </div>
            </div>

            <Card className="h-64 flex flex-col items-center justify-center relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {isDrawing ? (
                        <motion.div
                            key="shaking"
                            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-8xl"
                        >
                            🎁
                        </motion.div>
                    ) : drawnLetter ? (
                        <motion.div
                            key="result"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="text-9xl font-black text-wawag-pink"
                        >
                            {drawnLetter}
                        </motion.div>
                    ) : (
                        <div className="text-8xl opacity-50">❓</div>
                    )}
                </AnimatePresence>
            </Card>

            <Button
                onClick={drawLetter}
                disabled={isDrawing}
                className="w-full text-lg py-4 bg-wawag-pink hover:bg-pink-400"
            >
                {isDrawing ? "抽取中..." : "抽取字母 (-50 點)"}
            </Button>

            <Link href="/events/letters/redeem" className="block">
                <Button variant="outline" className="w-full">
                    兌換 "WAWAG" (+500 點)
                </Button>
            </Link>
        </div>
    );
}
