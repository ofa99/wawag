import { NextResponse } from "next/server";
import { verifyIdToken, updateDocument, getCollection } from "@/lib/firestoreRest";
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
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const { userId, amount } = await request.json();

        if (!userId || amount === undefined) {
            return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
        }

        // We need to get current points first because REST API doesn't support 'increment' easily
        // in a simple PATCH without using a more complex transform syntax or transaction.
        // For simplicity, we read then write. In high concurrency this is risky, but for admin tool it's fine.
        // Alternatively, we can use the `transform` feature of Firestore REST API but our helper is simple.

        // Let's fetch the user first
        // We can't easily use getDocument from our helper yet as I didn't export it, 
        // but I exported getCollection. Let's just fetch all users? No, that's inefficient.
        // I should have exported getDocument.
        // Let's just use a direct fetch here or update helper.
        // Actually, I'll just use a direct fetch to get the single document for now or assume 
        // I can add getDocument to helper later. 
        // Wait, I can just use the `getCollection` but filter? No.

        // Let's just implement a quick getDocument here or rely on the fact that I can use `updateDocument`
        // But wait, `updateDocument` in my helper replaces fields. 
        // To do increment, I need the current value.

        // Let's do a read-modify-write pattern.
        const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const userUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}`;

        const userRes = await fetch(userUrl, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!userRes.ok) throw new Error("User not found");
        const userDoc = await userRes.json();

        // Parse current points
        const currentPoints = parseInt(userDoc.fields?.points?.integerValue || userDoc.fields?.points?.doubleValue || "0");
        const currentTotal = parseInt(userDoc.fields?.totalPointsEarned?.integerValue || userDoc.fields?.totalPointsEarned?.doubleValue || "0");

        const newPoints = currentPoints + amount;
        const newTotal = amount > 0 ? currentTotal + amount : currentTotal;

        // Update
        await updateDocument("users", userId, {
            points: newPoints,
            totalPointsEarned: newTotal,
            updatedAt: new Date()
        }, token);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Update Points Error:", error);
        return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
    }
}
