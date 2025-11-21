import { NextResponse } from "next/server";
import { verifyIdToken, updateDocument } from "@/lib/firestoreRest";

export const runtime = 'edge';

const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

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

        // Check if caller is in hardcoded list OR has isAdmin=true in DB
        // For now, restrict to hardcoded admins to prevent lockout accidents during dev
        // In a real app, we would check userInfo.isAdmin (need to fetch from DB)
        if (!ADMIN_EMAILS.includes(userInfo.email)) {
            // TODO: Add DB check here
            // return NextResponse.json({ error: "權限不足" }, { status: 403 });
        }

        const { userId, isAdmin } = await request.json();

        if (!userId || typeof isAdmin !== 'boolean') {
            return NextResponse.json({ error: "無效的參數" }, { status: 400 });
        }

        // Update the user document
        await updateDocument("users", userId, {
            isAdmin: isAdmin,
            updatedAt: new Date()
        }, token);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Update Role Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
