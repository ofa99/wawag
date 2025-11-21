"use client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function RedeemPage() {
    const { user } = useAuth();
    const router = useRouter();

    const handleRedeem = async () => {
        try {
            const res = await fetch("/api/redeemLetters", {
                method: "POST",
                body: JSON.stringify({ uid: user.uid }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(`兌換成功！+${data.reward} 點！🎉`);
                router.push("/dashboard");
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error("兌換失敗");
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto text-center space-y-8 pt-20">
            <h1 className="text-3xl font-black text-wawag-blue">兌換 WAWAG</h1>

            <div className="flex justify-center gap-2 text-4xl font-black">
                <span className="text-wawag-pink animate-bounce" style={{ animationDelay: '0s' }}>W</span>
                <span className="text-wawag-blue animate-bounce" style={{ animationDelay: '0.1s' }}>A</span>
                <span className="text-wawag-pink animate-bounce" style={{ animationDelay: '0.2s' }}>W</span>
                <span className="text-wawag-blue animate-bounce" style={{ animationDelay: '0.3s' }}>A</span>
                <span className="text-wawag-yellow-dark animate-bounce" style={{ animationDelay: '0.4s' }}>G</span>
            </div>

            <div className="bg-white/50 p-6 rounded-3xl">
                <p className="font-bold text-gray-600 mb-4">需求:</p>
                <div className="flex justify-center gap-8">
                    <div>2x W</div>
                    <div>2x A</div>
                    <div>1x G</div>
                </div>
            </div>

            <Button onClick={handleRedeem} className="w-full text-xl py-4 bg-wawag-blue shadow-wawag-blue/30">
                領取 500 點！
            </Button>
        </div>
    );
}
