import { NextResponse } from "next/server";
import { verifyIdToken, createDocument } from "@/lib/firestoreRest";

export const runtime = 'edge';

const ADMIN_EMAILS = ["abc@gmail.com", "allenlu@example.com"];

export async function POST(request) {
    try {
        // 1. Verify Admin Token
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const userInfo = await verifyIdToken(token);

        if (!userInfo || !ADMIN_EMAILS.includes(userInfo.email)) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { points } = body;

        if (!points || typeof points !== 'number' || points <= 0) {
            return NextResponse.json({ error: "無效的點數數值" }, { status: 400 });
        }

        // 3. Generate Unique Code
        const codeId = `WAWAG-${globalThis.crypto.randomUUID().split('-')[0].toUpperCase()}`;

        // 4. Save to Firestore via REST API
        await createDocument("codes", {
            codeId,
            points,
            isUsed: false,
            createdAt: new Date(),
            usedAt: null
        }, token);

        // 5. Return Response
        return NextResponse.json({
            success: true,
            codeId,
            points
        });

    } catch (error) {
        console.error("Generate Code Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
