import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthContextProvider } from "@/context/AuthContext";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
    title: "Wawag - Claw Machine Membership",
    description: "Collect points, trade items, and have fun!",
    manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={outfit.className}>
                <AuthContextProvider>
                    <main className="min-h-screen bg-gradient-to-b from-wawag-pink/10 to-wawag-blue/10 pb-20">
                        {children}
                    </main>
                    <Toaster position="top-center" />
                </AuthContextProvider>
            </body>
        </html>
    );
}
