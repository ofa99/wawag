"use client";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Input } from "@/components/ui/Input";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getNextLevelProgress, getLevel } from "@/utils/calcLevel";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);
    const [progress, setProgress] = useState({ current: 0, max: 100, percent: 0, nextLevel: 2 });
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [prevLevel, setPrevLevel] = useState(null);

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferEmail, setTransferEmail] = useState("");
    const [transferAmount, setTransferAmount] = useState(10);
    const [transferLoading, setTransferLoading] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
                const data = doc.data();
                setUserData(data);

                const currentPoints = data?.totalPointsEarned || 0; // Use total points for level
                const newProgress = getNextLevelProgress(currentPoints);
                setProgress(newProgress);

                const currentLevel = getLevel(currentPoints);

                // Check for Level Up
                if (prevLevel !== null && currentLevel > prevLevel) {
                    setShowLevelUp(true);
                    setTimeout(() => setShowLevelUp(false), 3000);
                }
                setPrevLevel(currentLevel);
            });
            return () => unsub();
        }
    }, [user, prevLevel]);

    const handleDailyCheckIn = async () => {
        try {
            const res = await fetch("/api/addPoints", {
                method: "POST",
                body: JSON.stringify({ uid: user.uid, amount: 10, type: "DAILY" }),
            });
            if (res.ok) toast.success("Daily Bonus +10! 🌟");
            else toast.error("Already claimed today!");
        } catch (e) {
            toast.error("Failed to claim");
        }
    };

    const handleVipClaim = async () => {
        try {
            const res = await fetch("/api/claim-vip", {
                method: "POST",
                body: JSON.stringify({ uid: user.uid }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(`VIP Gift Claimed! +${data.reward} Points 🎁`);
            } else {
                toast.error(data.error || "Failed to claim");
            }
        } catch (e) {
            toast.error("Something went wrong");
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setTransferLoading(true);

        try {
            const res = await fetch("/api/transferPoints", {
                method: "POST",
                body: JSON.stringify({ fromUid: user.uid, toEmail: transferEmail, amount: Number(transferAmount) }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Sent ${transferAmount} points to ${transferEmail}!`);
                setShowTransferModal(false);
                setTransferEmail("");
                setTransferAmount(10);
            } else {
                toast.error(data.error || "Transfer failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setTransferLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            toast.success("See you soon! 👋");
        } catch (error) {
            toast.error("Failed to logout");
        }
    };

    const currentLevel = userData ? getLevel(userData.totalPointsEarned || 0) : 1;
    const isVip = currentLevel >= 7;

    const menuItems = [
        { name: "Transfer", action: () => setShowTransferModal(true), icon: "💸", color: "bg-wawag-green-light" },
        { name: "Collect", href: "/events/letters", icon: "🔠", color: "bg-wawag-yellow" },
        { name: "Scan QR", href: "/scanner", icon: "📷", color: "bg-wawag-pink-light" },
        { name: "My Bag", href: "/inventory", icon: "🎒", color: "bg-wawag-purple-light" },
    ];

    return (
        <div className="min-h-screen bg-wawag-cream pb-24 relative overflow-hidden">
            {/* Level Up Overlay */}
            <AnimatePresence>
                {showLevelUp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                        <div className="text-center text-white">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                                className="text-9xl mb-4"
                            >
                                🎉
                            </motion.div>
                            <h1 className="text-5xl font-black text-wawag-yellow drop-shadow-lg">LEVEL UP!</h1>
                            <p className="text-2xl font-bold mt-2">Welcome to Level {currentLevel}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transfer Modal Overlay */}
            <AnimatePresence>
                {showTransferModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowTransferModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-black text-wawag-purple mb-4 text-center">Send Points 💸</h2>
                            <form onSubmit={handleTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Receiver Email</label>
                                    <Input
                                        type="email"
                                        required
                                        value={transferEmail}
                                        onChange={(e) => setTransferEmail(e.target.value)}
                                        placeholder="friend@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Amount (Min 10)</label>
                                    <Input
                                        type="number"
                                        min="10"
                                        required
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        className="font-mono text-lg"
                                    />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowTransferModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-wawag-purple text-white hover:bg-purple-400"
                                        disabled={transferLoading}
                                    >
                                        {transferLoading ? "Sending..." : "Confirm"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Section */}
            <header className="bg-wawag-pink p-8 pb-12 rounded-b-4xl shadow-lg relative overflow-hidden">
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-4 right-4 text-6xl opacity-20"
                >☁️</motion.div>
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-4 left-4 text-5xl opacity-20"
                >⭐</motion.div>

                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-wawag-yellow">
                            <img
                                src={userData?.avatar || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.uid}`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-white">
                            <h1 className="text-2xl font-black tracking-wide">{userData?.displayName || "Guest"}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-white/30 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/50">
                                    LV.{currentLevel} {isVip ? "VIP 👑" : "Member"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleLogout}
                        className="bg-white/20 hover:bg-white/30 text-white border border-white/50 rounded-xl p-3 backdrop-blur-md shadow-sm"
                    >
                        <span className="text-xl">🚪</span>
                    </Button>
                </div>
            </header>

            <div className="p-4 space-y-6 -mt-8 relative z-10 max-w-md mx-auto">
                {/* Points Card */}
                <Card className="bg-gradient-to-br from-wawag-blue to-wawag-blue-light text-white border-none relative overflow-hidden shadow-wawag-blue/40 shadow-xl">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                    <div className="flex flex-col items-center py-4 relative z-10">
                        <span className="text-sm font-bold opacity-90 tracking-widest uppercase">Total Balance</span>
                        <motion.h2
                            key={userData?.points}
                            initial={{ scale: 1.5 }}
                            animate={{ scale: 1 }}
                            className="text-6xl font-black mt-2 drop-shadow-md"
                        >
                            {userData?.points || 0}
                        </motion.h2>
                        <Button
                            onClick={handleDailyCheckIn}
                            className="mt-6 bg-white text-wawag-blue hover:bg-gray-50 text-sm py-2 px-6 rounded-full shadow-none"
                        >
                            📅 Daily Check-in
                        </Button>
                    </div>
                </Card>

                {/* Level Progress */}
                <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-white">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                        <span className="text-wawag-pink">LEVEL {currentLevel}</span>
                        <span>{progress.current} / {progress.max} EXP</span>
                    </div>
                    <ProgressBar value={progress.percent} className="h-3" />
                    <p className="text-center text-xs text-gray-400 mt-2 font-medium">
                        {100 - Math.round(progress.percent)}% to Level {progress.nextLevel}! 🚀
                    </p>
                </div>

                {/* VIP Monthly Claim */}
                <div className={`p-1 rounded-3xl transition-all ${isVip ? "bg-gradient-to-r from-wawag-purple to-wawag-pink" : "bg-gray-200"}`}>
                    <div className="bg-white/90 rounded-[1.3rem] p-4 flex items-center justify-between">
                        <div>
                            <h3 className={`font-bold ${isVip ? "text-wawag-purple" : "text-gray-400"}`}>
                                {isVip ? "VIP Monthly Gift 🎁" : "VIP Locked 🔒"}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {isVip ? "Claim your monthly reward!" : "Reach LV.7 to unlock"}
                            </p>
                        </div>
                        <Button
                            variant={isVip ? "primary" : "ghost"}
                            className={isVip ? "bg-wawag-purple text-white" : "bg-gray-100 text-gray-400"}
                            disabled={!isVip}
                            onClick={handleVipClaim}
                        >
                            {isVip ? "Claim" : "Locked"}
                        </Button>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {menuItems.map((item) => (
                        item.href ? (
                            <Link href={item.href} key={item.name}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`${item.color} h-32 rounded-3xl flex flex-col items-center justify-center shadow-sm text-wawag-dark cursor-pointer relative overflow-hidden group`}
                                >
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-4xl mb-2 drop-shadow-sm">{item.icon}</span>
                                    <span className="font-bold text-sm opacity-80">{item.name}</span>
                                </motion.div>
                            </Link>
                        ) : (
                            <motion.div
                                key={item.name}
                                onClick={item.action}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`${item.color} h-32 rounded-3xl flex flex-col items-center justify-center shadow-sm text-wawag-dark cursor-pointer relative overflow-hidden group`}
                            >
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-4xl mb-2 drop-shadow-sm">{item.icon}</span>
                                <span className="font-bold text-sm opacity-80">{item.name}</span>
                            </motion.div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}
