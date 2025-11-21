import { NextResponse } from "next/server";
import { verifyIdToken, deleteDocument } from "@/lib/firestoreRest";

export const runtime = 'edge';

const ADMIN_EMAILS = ["abc@gmail.com", "allenlu@example.com"];

export async function POST(request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const userInfo = await verifyIdToken(token);

        if (!userInfo || !ADMIN_EMAILS.includes(userInfo.email)) {
            return NextResponse.json({ error: "權限不足" }, { status: 403 });
        }

        const { giftId } = await request.json();

        if (!giftId) {
            return NextResponse.json({ error: "無效的 Gift ID" }, { status: 400 });
        }

        await deleteDocument("gifts", giftId, token);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete Gift Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
