import { NextResponse } from "next/server";
import { verifyIdToken, updateDocument, getCollection } from "@/lib/firestoreRest";

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
        // For bootstrapping, we trust the hardcoded list.
        // Ideally we should fetch the caller's doc to check isAdmin, but for now let's stick to the pattern
        // and maybe add the DB check later or if requested.
        // The user asked to "Allow editing admin status", so we need this API.

        // Let's allow hardcoded admins to always perform this.
        if (!ADMIN_EMAILS.includes(userInfo.email)) {
            // TODO: Fetch user doc to check isAdmin if we want to fully migrate
            // For now, restrict to hardcoded admins to prevent lockout accidents during dev
            return NextResponse.json({ error: "權限不足" }, { status: 403 });
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
