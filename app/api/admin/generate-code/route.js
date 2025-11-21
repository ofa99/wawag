import { NextResponse } from "next/server";

export const runtime = 'edge';

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// import crypto from "crypto"; // Use global crypto in Edge

// Placeholder Admin List - In production, use custom claims or a database role field
const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export async function POST(request) {
    try {
        // 1. Basic Admin Verification
        const adminEmail = request.headers.get("x-admin-email");

        if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { points } = body;

        if (!points || typeof points !== 'number' || points <= 0) {
            return NextResponse.json({ error: "Invalid points value" }, { status: 400 });
        }

        // 3. Generate Unique Code
        const codeId = `WAWAG-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

        // 4. Save to Firestore
        const codeData = {
            codeId,
            points,
            isUsed: false,
            createdAt: serverTimestamp(),
            usedAt: null
        };

        await addDoc(collection(db, "codes"), codeData);

        // 5. Return Response
        return NextResponse.json({
            success: true,
            codeId,
            points
        });

    } catch (error) {
        console.error("Generate Code Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
