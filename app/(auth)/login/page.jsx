"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Welcome back! 🌸");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Login failed: " + error.message);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast.success("Welcome! ✨");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Google login failed");
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
                        <h1 className="text-3xl font-black text-wawag-dark tracking-tight">Welcome Back!</h1>
                        <p className="text-wawag-purple font-medium">Login to check your points</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wawag-pink ml-2 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                placeholder="bunny@wawag.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-wawag-cream border-2 border-transparent focus:border-wawag-pink focus:bg-white outline-none transition-all font-medium text-gray-600 placeholder-gray-300"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wawag-pink ml-2 uppercase tracking-wider">Password</label>
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
                            Login
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t-2 border-dashed border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                            <span className="bg-white px-4 text-gray-400">Or</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        className="w-full py-4 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-600 font-bold"
                        onClick={handleGoogleLogin}
                    >
                        <span className="mr-2">🌈</span> Continue with Google
                    </Button>

                    <p className="text-center text-sm font-medium text-gray-400">
                        New here?{" "}
                        <Link href="/register" className="text-wawag-pink font-black hover:underline decoration-2 underline-offset-4">
                            Create Account
                        </Link>
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}
