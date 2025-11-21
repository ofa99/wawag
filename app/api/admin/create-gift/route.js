import { NextResponse } from "next/server";
import { verifyIdToken, createDocument } from "@/lib/firestoreRest";
import { isUserAdmin } from "@/lib/adminAuth";

export const runtime = 'edge';


export async function POST(request) {
    try {
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
            // TODO: Add DB isAdmin check here as well
            return NextResponse.json({ error: "權限不足" }, { status: 403 });
        }

        const { name, cost, imageUrl } = await request.json();

        if (!name || !cost || !imageUrl) {
            return NextResponse.json({ error: "請填寫所有欄位" }, { status: 400 });
        }

        const giftData = {
            name,
            cost: parseInt(cost),
            imageUrl,
            createdBy: userInfo.uid,
            createdAt: new Date().toISOString()
        };

        const newGift = await createDocument("gifts", giftData, token);

        return NextResponse.json({ success: true, gift: newGift });

    } catch (error) {
        console.error("Create Gift Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
