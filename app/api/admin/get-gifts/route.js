import { NextResponse } from "next/server";
import { verifyIdToken, getCollection } from "@/lib/firestoreRest";

export const runtime = 'edge';

export async function GET(request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        // Verify token but don't restrict to admin, as users also need to see gifts
        const userInfo = await verifyIdToken(token);

        if (!userInfo) {
            return NextResponse.json({ error: "無效的 Token" }, { status: 403 });
        }

        const rawGifts = await getCollection("gifts", token);

        const gifts = rawGifts.map(data => ({
            id: data.id,
            ...data,
            // Ensure numeric values
            cost: data.cost || 0,
            createdAt: data.createdAt || null
        }));

        return NextResponse.json({ gifts });

    } catch (error) {
        console.error("Get Gifts Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
