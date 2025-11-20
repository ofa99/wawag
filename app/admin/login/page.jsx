"use client";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

// Hardcoded for client-side check, matching API
const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            if (ADMIN_EMAILS.includes(user.email)) {
                router.push("/admin/users");
            } else {
                toast.error("Access Denied: Not an Admin");
                // Optionally sign out or redirect to home
            }
        }
    }, [user, router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (ADMIN_EMAILS.includes(user.email)) {
                toast.success("Welcome Admin! 🛠️");
                router.push("/admin/users");
            } else {
                toast.error("You are not an admin!");
                await auth.signOut();
            }
        } catch (error) {
            toast.error("Login failed: " + error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-wawag-dark">
            <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-wawag-dark">Admin Panel</h1>
                    <p className="text-gray-500">Restricted Access</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Admin Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-wawag-dark outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-wawag-dark outline-none"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-wawag-dark text-white hover:bg-gray-800">
                        Login to Admin
                    </Button>
                </form>
            </Card>
        </div>
    );
}
