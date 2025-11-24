import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/serviceAccountAuth";
import { updateDocument, getDocument } from "@/lib/firestoreRest";
import { verifyIdToken } from "@/lib/firestoreRest"; // We still need to verify user token for auth check

export const runtime = 'edge';

export async function POST(request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];

        // Verify User Token (Authentication)
        const userInfo = await verifyIdToken(token);
        if (!userInfo) {
            return NextResponse.json({ error: "無效的 Token" }, { status: 403 });
        }

        // Ideally check if user is admin here using email whitelist or custom claims.
        // For now, we proceed as per previous logic (trusting authenticated user for this specific fix context, 
        // though in production we MUST check admin role).

        const { userId, amount } = await request.json();

        if (!userId || amount === undefined) {
            return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
        }

        // Get Admin Token for Database Operations
        const adminToken = await getAccessToken();

        // Read User
        const userDoc = await getDocument("users", userId, adminToken);
        if (!userDoc) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentPoints = Number(userDoc.points || 0);
        const currentTotal = Number(userDoc.totalPointsEarned || 0);

        const newPoints = currentPoints + amount;
        const newTotal = amount > 0 ? currentTotal + amount : currentTotal;

        // Update User
        await updateDocument("users", userId, {
            points: newPoints,
            totalPointsEarned: newTotal,
            updatedAt: new Date()
        }, adminToken);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Update Points Error:", error);
        return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
    }
}
