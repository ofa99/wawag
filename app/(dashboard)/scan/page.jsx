"use client";
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { doc, runTransaction, collection, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function ScanPage() {
    const [scanResult, setScanResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [manualCode, setManualCode] = useState("");

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        function onScanSuccess(decodedText, decodedResult) {
            if (isProcessing) return;
            handleClaim(decodedText, scanner);
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
        }

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, []);

    const handleClaim = async (code, scannerInstance = null) => {
        if (isProcessing) return;
        setIsProcessing(true);

        // Safety timeout to reset processing state
        const safetyTimeout = setTimeout(() => {
            setIsProcessing(false);
            if (scannerInstance) scannerInstance.resume();
        }, 10000);

        if (scannerInstance) {
            scannerInstance.pause();
        }

        try {
            // Extract code from URL if present
            let cleanCode = code;
            try {
                const url = new URL(code);
                // Assuming the code is the last part of the path or a query param
                // Example 1: https://wawag.com/claim/CODE123 -> CODE123
                // Example 2: https://wawag.com?code=CODE123 -> CODE123
                const pathParts = url.pathname.split('/').filter(p => p);
                if (pathParts.length > 0) {
                    cleanCode = pathParts[pathParts.length - 1];
                } else if (url.searchParams.has('code')) {
                    cleanCode = url.searchParams.get('code');
                }
            } catch (e) {
                // Not a URL, use as is
                cleanCode = code;
            }

            console.log("Scanned code:", code, "Cleaned code:", cleanCode);

            // Call API to claim code
            const res = await fetch("/api/claim-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    codeId: cleanCode,
                    uid: auth.currentUser?.uid
                })
            });

            const data = await res.json();

            clearTimeout(safetyTimeout);

            if (data.success) {
                toast.success(`耶！+${data.points} 點！🎉`);
                setScanResult(cleanCode);
                if (scannerInstance) {
                    scannerInstance.clear();
                }
            } else {
                toast.error(data.message || "無效的代碼 😢");
                if (scannerInstance) {
                    scannerInstance.resume();
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("兌換失敗");
            if (scannerInstance) {
                scannerInstance.resume();
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        handleClaim(manualCode);
    };

    return (
        <div className="p-4 flex flex-col items-center space-y-6 pb-20">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-wawag-blue">掃描 QR Code</h1>
                <p className="text-gray-500">將鏡頭對準機台的 QR Code</p>
            </div>

            <Card className="w-full max-w-md overflow-hidden bg-white p-4">
                <div id="reader" className="w-full"></div>
            </Card>

            <div className="w-full max-w-md">
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400">或</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <form onSubmit={handleManualSubmit} className="flex gap-2 mt-2">
                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="輸入代碼"
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wawag-blue"
                    />
                    <button
                        type="submit"
                        disabled={isProcessing || !manualCode.trim()}
                        className="bg-wawag-blue text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                        {isProcessing ? "處理中..." : "兌換"}
                    </button>
                </form>
            </div>

            {scanResult && (
                <div className="text-center p-4 bg-green-100 text-green-700 rounded-xl w-full max-w-md">
                    已成功兌換: {scanResult}
                </div>
            )}
        </div>
    );
}
