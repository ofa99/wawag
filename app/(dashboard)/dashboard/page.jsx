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
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [progress, setProgress] = useState({ current: 0, max: 100, percent: 0, nextLevel: 2 });
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [prevLevel, setPrevLevel] = useState(null);

    // Derived values
    const points = userData?.points || 0;
    const currentLevel = userData ? getLevel(userData.totalPointsEarned || 0) : 1;
    const level = currentLevel;
    const nextLevelPoints = progress.max;
    const progressPercent = Math.round(progress.percent);
    const vipStatus = (userData?.vipStatus === true) || (level >= 7);
    const hasCheckedIn = false;
    const isVip = currentLevel >= 7;

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
            if (res.ok) toast.success("每日簽到 +10! 🌟");
            else toast.error("今天已經簽到過了！");
        } catch (e) {
            toast.error("簽到失敗");
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
                toast.success(`VIP 禮物已領取！ +${data.reward} 點 🎁`);
            } else {
                toast.error(data.error || "領取失敗");
            }
        } catch (e) {
            toast.error("發生錯誤");
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setTransferLoading(true);

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/transferPoints", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ fromUid: user.uid, toEmail: transferEmail, amount: Number(transferAmount) }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`已發送 ${transferAmount} 點給 ${transferEmail}!`);
                setShowTransferModal(false);
                setTransferEmail("");
                setTransferAmount(10);
            } else {
                toast.error(data.error || "轉帳失敗");
            }
        } catch (error) {
            toast.error("發生錯誤");
        } finally {
            setTransferLoading(false);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        window.location.href = "/login";
    };

    const handleCheckIn = handleDailyCheckIn;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-300 via-pink-200 to-pink-300">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <p className="text-xl font-bold text-gray-700">請先登入</p>
                </div>
            </div>
        );
    }

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
                            <h1 className="text-5xl font-black text-wawag-yellow drop-shadow-lg">升級啦！</h1>
                            <p className="text-2xl font-bold mt-2">歡迎來到等級 {currentLevel}</p>
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
                            <h2 className="text-2xl font-black text-wawag-purple mb-4 text-center">發送點數 💸</h2>
                            <form onSubmit={handleTransfer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">接收者 Email</label>
                                    <Input
                                        type="email"
                                        required
                                        value={transferEmail}
                                        onChange={(e) => setTransferEmail(e.target.value)}
                                        placeholder="friend@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">數量 (最少 10)</label>
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
                                        取消
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-wawag-purple text-white hover:bg-purple-400"
                                        disabled={transferLoading}
                                    >
                                        {transferLoading ? "發送中..." : "確認"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gradient Background */}
            <div className="fixed inset-0 bg-gradient-to-b from-sky-300 via-pink-200 to-pink-300 -z-10" />

            {/* Floating Clouds */}
            <div className="fixed inset-0 pointer-events-none -z-5">
                <div className="absolute top-10 left-10 w-32 h-20 bg-white/60 rounded-full blur-sm animate-float" />
                <div className="absolute top-20 right-20 w-40 h-24 bg-white/50 rounded-full blur-sm animate-float-delayed" />
                <div className="absolute bottom-32 left-1/4 w-36 h-22 bg-white/40 rounded-full blur-sm animate-float" />
                <div className="absolute top-1/3 right-1/3 w-28 h-18 bg-white/50 rounded-full blur-sm animate-float-delayed" />
            </div>

            {/* Floating Capsules */}
            <div className="fixed inset-0 pointer-events-none -z-5">
                <div className="absolute top-1/4 left-20 w-16 h-16 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full opacity-60 animate-float-slow" />
                <div className="absolute top-1/2 right-32 w-14 h-14 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full opacity-60 animate-float-slow-delayed" />
                <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-gradient-to-br from-green-300 to-teal-300 rounded-full opacity-60 animate-float-slow" />
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Header - User Info Card (Claw Machine Top) */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-6"
                >
                    <div className="relative bg-gradient-to-r from-pink-400 to-pink-500 rounded-t-3xl p-4 shadow-xl border-4 border-pink-600">
                        <div className="flex items-center justify-between mt-4">
                            {/* Avatar */}
                            <Link href="/profile/edit">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative"
                                >
                                    <div className="w-20 h-20 rounded-full bg-yellow-300 border-4 border-white shadow-lg overflow-hidden">
                                        <img
                                            src={userData?.avatar || userData?.photoURL || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.uid}`}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </motion.div>
                            </Link>

                            {/* Name & Level */}
                            <div className="flex-1 ml-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black text-white drop-shadow-lg tracking-wider">
                                        {userData?.displayName || "訪客"}
                                    </h2>
                                    <Link href="/profile/edit">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="text-white/80 hover:text-white"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </motion.button>
                                    </Link>
                                </div>
                                <div className="inline-block bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold mt-1 shadow-md tracking-wide">
                                    Lv.{level} 會員
                                </div>
                            </div>

                            {/* Points Badge with Logout Button */}
                            <div className="relative">
                                <div className="bg-yellow-400 rounded-full w-16 h-16 flex items-center justify-center border-4 border-yellow-600 shadow-lg">
                                    <div className="text-center">
                                        <div className="text-2xl">🪙</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="absolute -top-2 -right-2 z-20 bg-pink-400 hover:bg-pink-500 text-white p-1.5 rounded-full shadow-md transition-all border-2 border-white"
                                    title="登出"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Glass Display - Balance & Actions */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-6"
                >
                    {/* Glass Frame */}
                    <div className="bg-gradient-to-b from-pink-300/80 to-pink-400/80 backdrop-blur-xl rounded-3xl p-6 border-8 border-pink-500 shadow-2xl">
                        {/* Claw Icon */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className="text-6xl filter drop-shadow-lg">🦾</div>
                        </div>

                        {/* Balance Display */}
                        <div className="text-center mt-8 mb-6">
                            <div className="text-sm font-bold text-purple-900 mb-2 tracking-widest">目前餘額</div>
                            <div className="relative inline-block">
                                <div className="bg-yellow-300 rounded-full px-8 py-4 border-6 border-yellow-500 shadow-xl">
                                    <div className="text-5xl font-black text-yellow-900 tracking-widest">{points}</div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-center mb-4">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCheckIn}
                                disabled={hasCheckedIn}
                                className={`relative px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all tracking-wide ${hasCheckedIn
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
                                    }`}
                            >
                                <span className="relative z-10">
                                    {hasCheckedIn ? "✓ 已簽到" : "🎁 每日簽到"}
                                </span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push("/scan")}
                                className="relative px-6 py-3 bg-gradient-to-b from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 rounded-xl font-bold text-white shadow-lg transition-all tracking-wide"
                            >
                                <span className="relative z-10">🎯 開始抓寶</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Level Progress Bar */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 rounded-full p-4 border-6 border-yellow-600 shadow-xl relative overflow-hidden">
                        {/* Decorative Stars */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl animate-pulse">⭐</div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl animate-pulse">⭐</div>

                        <div className="text-center mb-2">
                            <span className="font-black text-yellow-900 text-lg tracking-wider">等級 {level}</span>
                        </div>
                        <div className="relative h-8 bg-yellow-200 rounded-full overflow-hidden border-4 border-yellow-700">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                            </motion.div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-black text-yellow-900 drop-shadow-lg tracking-wide">
                                    {progress.current} / {nextLevelPoints} 經驗值
                                </span>
                            </div>
                        </div>
                        <div className="text-center mt-2 text-xs font-bold text-yellow-900 tracking-wide">
                            距離 Lv.{level + 1} 還差 {100 - progressPercent}% 🎉
                        </div>
                    </div>
                </motion.div>

                {/* VIP Status */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                >
                    {vipStatus ? (
                        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-2xl p-4 border-6 border-yellow-600 shadow-xl relative overflow-hidden">
                            {/* Chain decoration */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-600" />
                            <div className="text-center">
                                <div className="text-2xl mb-2">👑</div>
                                <div className="font-black text-yellow-900 text-lg tracking-wider">VIP 已解鎖</div>
                                <div className="text-sm text-yellow-800 mt-1 font-bold">享受專屬福利！</div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400 rounded-2xl p-4 border-6 border-gray-600 shadow-xl relative overflow-hidden">
                            {/* Chain decoration */}
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]" />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl">🔒</div>
                            <div className="text-center relative z-10">
                                <div className="font-black text-gray-900 text-lg tracking-wider">VIP 未解鎖 🔒</div>
                                <div className="text-sm text-gray-800 mt-1 font-bold">達到 Lv.7 解鎖</div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Bottom Navigation Buttons */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 gap-4"
                >
                    {/* Transfer Button */}
                    <motion.div
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                        onClick={() => setShowTransferModal(true)} // Use existing modal
                    >
                        <div className="bg-gradient-to-b from-green-400 to-green-600 rounded-3xl p-6 border-6 border-green-700 shadow-xl relative overflow-hidden">
                            {/* Button frame decoration */}
                            <div className="absolute top-2 left-2 right-2 h-3 bg-green-300/50 rounded-full" />
                            <div className="absolute bottom-2 left-2 right-2 h-3 bg-green-800/50 rounded-full" />

                            <div className="text-center relative z-10">
                                <div className="text-5xl mb-2">💰</div>
                                <div className="font-black text-white text-xl drop-shadow-lg tracking-wider">轉帳</div>
                            </div>

                            {/* Joystick decoration */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-gradient-to-b from-red-500 to-red-700 rounded-full border-4 border-red-800 shadow-lg" />
                        </div>
                    </motion.div>

                    {/* Collect (Scan) Button */}
                    <Link href="/scan">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative"
                        >
                            <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-3xl p-6 border-6 border-yellow-700 shadow-xl relative overflow-hidden">
                                {/* Button frame decoration */}
                                <div className="absolute top-2 left-2 right-2 h-3 bg-yellow-300/50 rounded-full" />
                                <div className="absolute bottom-2 left-2 right-2 h-3 bg-yellow-800/50 rounded-full" />

                                <div className="text-center relative z-10">
                                    <div className="text-5xl mb-2">🎲</div>
                                    <div className="font-black text-white text-xl drop-shadow-lg tracking-wider">收集</div>
                                </div>

                                {/* Joystick decoration */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-gradient-to-b from-red-500 to-red-700 rounded-full border-4 border-red-800 shadow-lg" />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Gift Redemption Button */}
                    <Link href="/gifts" className="col-span-2">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative"
                        >
                            <div className="bg-gradient-to-b from-pink-400 to-pink-600 rounded-3xl p-6 border-6 border-pink-700 shadow-xl relative overflow-hidden flex items-center justify-center gap-4">
                                {/* Button frame decoration */}
                                <div className="absolute top-2 left-2 right-2 h-3 bg-pink-300/50 rounded-full" />
                                <div className="absolute bottom-2 left-2 right-2 h-3 bg-pink-800/50 rounded-full" />

                                <div className="text-5xl relative z-10">🎁</div>
                                <div className="text-center relative z-10">
                                    <div className="font-black text-white text-2xl drop-shadow-lg tracking-wider">禮物兌換</div>
                                    <div className="text-white/80 text-sm font-bold">用點數換好禮</div>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                </motion.div>

                {/* Bottom Navigation Icons */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 bg-gradient-to-r from-pink-300 to-pink-400 rounded-full p-4 border-6 border-pink-500 shadow-xl"
                >
                    <div className="flex justify-around items-center">
                        <Link href="/dashboard">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-pink-400 shadow-lg">
                                    <span className="text-3xl">🏠</span>
                                </div>
                                <span className="text-xs font-bold text-white mt-1 tracking-wide">首頁</span>
                            </motion.div>
                        </Link>

                        <Link href="/profile/edit">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-pink-400 shadow-lg">
                                    <span className="text-3xl">👤</span>
                                </div>
                                <span className="text-xs font-bold text-white mt-1 tracking-wide">個人檔案</span>
                            </motion.div>
                        </Link>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-30px) translateX(10px); }
                }
                @keyframes float-slow-delayed {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-25px) translateX(-10px); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 7s ease-in-out infinite;
                }
                .animate-float-slow {
                    animation: float-slow 10s ease-in-out infinite;
                }
                .animate-float-slow-delayed {
                    animation: float-slow-delayed 12s ease-in-out infinite;
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}
