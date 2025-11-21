"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function TransferPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [amount, setAmount] = useState(10);
    const [loading, setLoading] = useState(false);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/transferPoints", {
                method: "POST",
                body: JSON.stringify({ fromUid: user.uid, toEmail: email, amount: Number(amount) }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`已發送 ${amount} 點給 ${email}!`);
                router.push("/dashboard");
            } else {
                toast.error(data.error || "轉帳失敗");
            }
        } catch (error) {
            toast.error("發生錯誤");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            <h1 className="text-2xl font-black text-wawag-purple text-center">發送點數 💸</h1>

            <Card className="p-6 space-y-6">
                <form onSubmit={handleTransfer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">接收者 Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-wawag-purple outline-none"
                            placeholder="friend@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">數量 (最少 10)</label>
                        <input
                            type="number"
                            min="10"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-wawag-purple outline-none font-mono text-lg"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-wawag-purple hover:bg-purple-400 text-white"
                        disabled={loading}
                    >
                        {loading ? "發送中..." : "確認轉帳"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
