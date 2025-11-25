import { NextResponse } from "next/server";
import { verifyIdToken, getDocument, updateDocument, createDocument, runTransaction } from "@/lib/firestoreRest";
import { getAccessToken } from "@/lib/serviceAccountAuth";

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

        // Get Admin Access Token for transaction (to allow updating gifts/inventory)
        const accessToken = await getAccessToken();

        // Use Transaction for atomic update
        await runTransaction(accessToken, async (transaction) => {
            // 1. Get Gift
            const giftDoc = await transaction.get("gifts", giftId);
            if (!giftDoc.exists) throw new Error("禮物不存在");

            const cost = Number(giftDoc.data.cost || 0);
            const stock = giftDoc.data.stock !== undefined ? Number(giftDoc.data.stock) : null; // null means unlimited

            if (stock !== null && stock <= 0) {
                throw new Error("禮物已兌換完畢");
            }

            // 2. Get User
            const userDoc = await transaction.get("users", userInfo.uid);
            if (!userDoc.exists) throw new Error("使用者不存在");

            const currentPoints = Number(userDoc.data.points || 0);

            if (currentPoints < cost) {
                throw new Error("點數不足");
            }

            // 3. Update User Points
            transaction.update("users", userInfo.uid, {
                points: currentPoints - cost,
                updatedAt: new Date()
            });

            // 4. Update Gift Stock
            if (stock !== null) {
                transaction.update("gifts", giftId, {
                    stock: stock - 1
                });
            }

            // 5. Create Inventory Item
            const inventoryId = crypto.randomUUID();
            transaction.create("inventory", inventoryId, {
                userId: userInfo.uid,
                giftId: giftId,
                name: giftDoc.data.name,
                imageUrl: giftDoc.data.imageUrl,
                redeemedAt: new Date().toISOString()
            });
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Redeem Gift Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
