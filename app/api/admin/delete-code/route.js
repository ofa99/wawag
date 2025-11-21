import { NextResponse } from "next/server";
import { verifyIdToken, deleteDocument } from "@/lib/firestoreRest";
import { isUserAdmin } from "@/lib/adminAuth";

export const runtime = 'edge';

// Placeholder Admin List

export async function DELETE(request) {
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
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "缺少代碼 ID" }, { status: 400 });
        }

        // Delete via REST API
        // Note: REST API delete returns success even if doc doesn't exist usually, 
        // or 404 if we check. Our helper throws if not ok.
        await deleteDocument("codes", id, token);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete Code Error:", error);
        return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
    }
}
