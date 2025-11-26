import { NextResponse } from "next/server";
import { verifyIdToken, createDocument } from "@/lib/firestoreRest";
import { isUserAdmin } from "@/lib/adminAuth";

export const runtime = 'edge';


export async function POST(request) {
    try {
        // 1. Verify Admin Token
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const userInfo = await verifyIdToken(token);

        if (!userInfo) {
            return NextResponse.json({ error: "無效的 Token" }, { status: 403 });
        }

        // Check if user is admin
        const isAdmin = await isUserAdmin(userInfo, token);
        if (!isAdmin) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { points, count = 1, prefix = "WAWAG" } = body;

        if (!points || typeof points !== 'number' || points <= 0) {
            return NextResponse.json({ error: "無效的點數數值" }, { status: 400 });
        }

        if (count > 99) {
            return NextResponse.json({ error: "一次最多產生 99 組" }, { status: 400 });
        }

        const generateOne = async () => {
            // Generate 10 random characters
            const randomSuffix = Array.from(crypto.getRandomValues(new Uint8Array(5)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase();

            const codeId = `${prefix.toUpperCase()}-${randomSuffix}`;
            const docData = {
                codeId,
                points,
                isUsed: false,
                createdAt: new Date(),
                usedAt: null
            };
            await createDocument("codes", docData, token);
            return { codeId, points };
        };

        if (count > 1) {
            const promises = Array(count).fill(0).map(() => generateOne());
            const codes = await Promise.all(promises);
            return NextResponse.json({ success: true, codes });
        } else {
            const result = await generateOne();
            return NextResponse.json({
                success: true,
                ...result
            });
        }

    } catch (error) {
        console.error("Generate Code Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
