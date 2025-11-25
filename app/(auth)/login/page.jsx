"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const getRedirectPath = () => {
        const returnUrl = searchParams.get("returnUrl");
        return returnUrl || "/dashboard";
    };

    useEffect(() => {
        if (user) {
            router.push(getRedirectPath());
        }
    }, [user, router, searchParams]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            let loginEmail = email;

            // Check if input looks like a Taiwan phone number (09xxxxxxxx)
            const phoneRegex = /^09\d{8}$/;
            if (phoneRegex.test(email)) {
                loginEmail = `${email}@phone.wawag.local`;
            }

            await signInWithEmailAndPassword(auth, loginEmail, password);
            toast.success("歡迎回來！🌸");
            router.push(getRedirectPath());
        } catch (error) {
            console.error(error);

            if (error.code === 'auth/user-not-found') {
                toast.error("尚未註冊，即將轉跳至註冊頁面...");
                // Redirect to register page with the email/phone pre-filled
                setTimeout(() => {
                    router.push(`/register?email=${encodeURIComponent(email)}`);
                }, 1500);
                return;
            }

            if (error.code === 'auth/wrong-password') {
                toast.error("密碼錯誤，請洽管理員");
                return;
            }

            let message = "登入失敗";
            if (error.code === 'auth/invalid-email') message = "帳號格式錯誤";
            if (error.code === 'auth/invalid-credential') message = "帳號或密碼錯誤";

            toast.error(message);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast.success("歡迎！✨");
            router.push(getRedirectPath());
        } catch (error) {
            toast.error("Google 登入失敗");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-wawag-pink-light via-wawag-cream to-wawag-blue-light">
            {/* Floating Background Elements */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 left-10 text-6xl opacity-50"
            >☁️</motion.div>
            <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 right-10 text-6xl opacity-50"
            >⭐</motion.div>
            <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/3 right-20 text-4xl opacity-30"
            >🎈</motion.div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md z-10"
            >
                <Card className="space-y-8 p-8 bg-white/80 backdrop-blur-xl border-4 border-white shadow-2xl rounded-3xl">
                    <div className="text-center space-y-2">
                        <motion.div
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl mb-4 inline-block"
                        >
                            🐰
                        </motion.div>
                        <h1 className="text-3xl font-black text-wawag-dark tracking-tight">歡迎回來！</h1>
                        <p className="text-wawag-purple font-medium">登入查看您的點數</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wawag-pink ml-2 uppercase tracking-wider">手機號碼 / 電子郵件</label>
                            <input
                                type="text"
                                placeholder="輸入手機號碼或 Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-wawag-cream border-2 border-transparent focus:border-wawag-pink focus:bg-white outline-none transition-all font-medium text-gray-600 placeholder-gray-300"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wawag-pink ml-2 uppercase tracking-wider">密碼</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-wawag-cream border-2 border-transparent focus:border-wawag-pink focus:bg-white outline-none transition-all font-medium text-gray-600 placeholder-gray-300"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full py-4 text-lg font-black rounded-2xl bg-wawag-pink hover:bg-wawag-pink/90 text-white shadow-lg shadow-wawag-pink/30 transform transition hover:-translate-y-1">
                            登入
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-2 border-dashed border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                            <span className="bg-white px-4 text-gray-400">或</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        className="w-full py-4 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-600 font-bold"
                        onClick={handleGoogleLogin}
                    >
                        <span className="mr-2">🌈</span> 使用 Google 繼續
                    </Button>

                    <p className="text-center text-sm font-medium text-gray-400">
                        新朋友？{" "}
                        <Link href="/register" className="text-wawag-pink font-black hover:underline decoration-2 underline-offset-4">
                            建立帳戶
                        </Link>
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}
