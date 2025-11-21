import { NextResponse } from "next/server";
import { verifyIdToken, getDocument, updateDocument, createDocument } from "@/lib/firestoreRest";

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

        const { giftId } = await request.json();

        if (!giftId) {
            return NextResponse.json({ error: "無效的 Gift ID" }, { status: 400 });
        }

        // 1. Get Gift Details
        const giftDoc = await getDocument("gifts", giftId, token);
        if (!giftDoc) {
            return NextResponse.json({ error: "禮物不存在" }, { status: 404 });
        }
        const giftCost = giftDoc.fields.cost ? parseInt(giftDoc.fields.cost.integerValue || giftDoc.fields.cost.stringValue) : 0;
        const giftName = giftDoc.fields.name ? giftDoc.fields.name.stringValue : "Unknown Gift";
        const giftImage = giftDoc.fields.imageUrl ? giftDoc.fields.imageUrl.stringValue : "";

        // 2. Get User Details (Points)
        const userDoc = await getDocument("users", userInfo.uid, token);
        if (!userDoc) {
            return NextResponse.json({ error: "使用者不存在" }, { status: 404 });
        }

        // Handle different number types from Firestore (integer or double)
        let currentPoints = 0;
        if (userDoc.fields.points) {
            currentPoints = parseInt(userDoc.fields.points.integerValue || userDoc.fields.points.doubleValue || 0);
        } else if (userDoc.fields.totalPointsEarned) {
            // Fallback if points field is missing but totalPointsEarned exists (though points should be the balance)
            // Actually, we should rely on 'points' field for balance.
            currentPoints = parseInt(userDoc.fields.totalPointsEarned.integerValue || 0);
        }

        if (currentPoints < giftCost) {
            return NextResponse.json({ error: "點數不足" }, { status: 400 });
        }

        // 3. Deduct Points
        const newPoints = currentPoints - giftCost;
        await updateDocument("users", userInfo.uid, {
            points: newPoints,
            updatedAt: new Date()
        }, token);

        // 4. Add to Inventory (Sub-collection or separate collection?)
        // Let's use a root collection 'inventory' with userId field, or a subcollection.
        // Firestore REST API makes subcollections a bit verbose to address sometimes, but let's try root collection 'inventory'
        // Structure: inventory/{id} -> { userId, giftId, name, imageUrl, redeemedAt }

        const inventoryItem = {
            userId: userInfo.uid,
            giftId: giftId,
            name: giftName,
            imageUrl: giftImage,
            redeemedAt: new Date().toISOString()
        };

        await createDocument("inventory", inventoryItem, token);

        return NextResponse.json({ success: true, remainingPoints: newPoints });

    } catch (error) {
        console.error("Redeem Gift Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
