"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            let registerEmail = email;
            let phoneNumber = null;

            // Check if input looks like a Taiwan phone number (09xxxxxxxx)
            const phoneRegex = /^09\d{8}$/;
            if (phoneRegex.test(email)) {
                registerEmail = `${email}@phone.wawag.local`;
                phoneNumber = email;
            }

            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, password);
            const user = userCredential.user;

            // 2. Update Profile
            await updateProfile(user, { displayName: name });

            // 3. Create Firestore Document
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: name,
                email: registerEmail,
                phone: phoneNumber, // Store phone if registered with phone
                points: 0,
                createdAt: new Date().toISOString(),
                avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user.uid}`
            });

            toast.success("帳戶建立成功！🎉");
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            let message = "註冊失敗";
            if (error.code === 'auth/email-already-in-use') message = "此帳號（手機/Email）已註冊";
            if (error.code === 'auth/invalid-email') message = "帳號格式錯誤";
            if (error.code === 'auth/weak-password') message = "密碼強度不足";

            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-wawag-blue-light via-wawag-cream to-wawag-yellow">
            {/* Floating Background Elements */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 right-10 text-6xl opacity-50"
            >🚀</motion.div>
            <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 left-10 text-6xl opacity-50"
            >🪐</motion.div>
            <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/3 left-20 text-4xl opacity-30"
            >✨</motion.div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md z-10"
            >
                <Card className="space-y-8 p-8 bg-white/80 backdrop-blur-xl border-4 border-white shadow-2xl rounded-3xl">
                    <div className="text-center space-y-2">
                        <motion.div
                            animate={{ bounce: [0, -10, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-6xl mb-4 inline-block"
                        >
                            🐻
                        </motion.div>
                        <h1 className="text-3xl font-black text-wawag-blue tracking-tight">加入我們！</h1>
                        <p className="text-wawag-dark font-medium">建立帳戶開始收集點數</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wawag-blue ml-2 uppercase tracking-wider">暱稱</label>
                            <input
                                type="text"
                                placeholder="超級熊熊"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-wawag-cream border-2 border-transparent focus:border-wawag-blue focus:bg-white outline-none transition-all font-medium text-gray-600 placeholder-gray-300"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wawag-blue ml-2 uppercase tracking-wider">手機號碼 / 電子郵件</label>
                            <input
                                type="text"
                                placeholder="輸入手機號碼或 Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-wawag-cream border-2 border-transparent focus:border-wawag-blue focus:bg-white outline-none transition-all font-medium text-gray-600 placeholder-gray-300"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wawag-blue ml-2 uppercase tracking-wider">密碼</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-wawag-cream border-2 border-transparent focus:border-wawag-blue focus:bg-white outline-none transition-all font-medium text-gray-600 placeholder-gray-300"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full py-4 text-lg font-black rounded-2xl bg-wawag-blue hover:bg-wawag-blue/90 text-white shadow-lg shadow-wawag-blue/30 transform transition hover:-translate-y-1">
                            建立帳戶
                        </Button>
                    </form>

                    <p className="text-center text-sm font-medium text-gray-400">
                        已經有帳戶了嗎？{" "}
                        <Link href="/login" className="text-wawag-blue font-black hover:underline decoration-2 underline-offset-4">
                            登入
                        </Link>
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}
