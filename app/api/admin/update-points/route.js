import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

export const runtime = 'edge';


// Placeholder Admin List
const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export async function POST(request) {
    try {
        const adminEmail = request.headers.get("x-admin-email");
        if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const { userId, amount } = await request.json();

        if (!userId || amount === undefined) {
            return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
        }

        const userRef = doc(db, "users", userId);

        // Update points
        const updates = {
            points: increment(amount),
            updatedAt: new Date().toISOString()
        };

        // If adding points, also increment totalPointsEarned (affects level)
        if (amount > 0) {
            updates.totalPointsEarned = increment(amount);
        }

        await updateDoc(userRef, updates);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Update Points Error:", error);
        return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
    }
}
