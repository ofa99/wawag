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

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        async function onScanSuccess(decodedText, decodedResult) {
            if (isProcessing) return;

            // Prevent multiple scans
            setIsProcessing(true);
            scanner.clear();
            setScanResult(decodedText);

            try {
                // Call API to claim code
                const res = await fetch("/api/claim-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        codeId: decodedText,
                        uid: auth.currentUser.uid
                    })
                });

                const data = await res.json();

                if (data.success) {
                    toast.success(`耶！+${data.points} 點！🎉`);
                    // Optional: Play sound or show modal
                } else {
                    toast.error(data.message || "無效的代碼 😢");
                }
            } catch (error) {
                console.error(error);
                toast.error("兌換失敗");
            } finally {
                setIsProcessing(false);
            }
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
        }

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, []);

    return (
        <div className="p-4 flex flex-col items-center space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-wawag-blue">掃描 QR Code</h1>
                <p className="text-gray-500">將鏡頭對準機台的 QR Code</p>
            </div>

            <Card className="w-full max-w-md overflow-hidden bg-black/5">
                <div id="reader" className="w-full"></div>
            </Card>

            {scanResult && (
                <div className="text-center p-4 bg-green-100 text-green-700 rounded-xl">
                    已掃描: {scanResult}
                </div>
            )}
        </div>
    );
}
