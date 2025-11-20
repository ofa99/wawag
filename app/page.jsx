import Link from "next/link";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center space-y-8">
            <div className="space-y-2 animate-bounce-slow">
                <h1 className="text-6xl font-black text-wawag-pink text-outline tracking-tighter">
                    WAWAG
                </h1>
                <p className="text-xl text-gray-600 font-medium">
                    Play. Collect. Trade.
                </p>
            </div>

            <div className="relative w-64 h-64 bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden border-4 border-wawag-yellow">
                <div className="text-9xl">🧸</div>
            </div>

            <div className="w-full max-w-xs space-y-4">
                <Link
                    href="/login"
                    className="block w-full py-4 bg-wawag-pink text-white text-xl font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95"
                >
                    Start Playing!
                </Link>

                <div className="flex justify-center gap-4 text-sm text-gray-500">
                    <span>✨ Collect Points</span>
                    <span>🎁 Win Prizes</span>
                </div>
            </div>
        </div>
    );
}
