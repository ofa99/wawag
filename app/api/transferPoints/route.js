import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/serviceAccountAuth";
import { runTransaction } from "@/lib/firestoreRest";

export const runtime = 'edge';

export async function POST(request) {
    const { fromUid, toEmail, amount } = await request.json();

    if (!fromUid || !toEmail || !amount || amount < 10) {
        return NextResponse.json({ error: "無效的請求" }, { status: 400 });
    }

    try {
        const adminToken = await getAccessToken();

        // 1. Find Receiver ID first (Query)
        // Similar to claim-code, we query first.
        const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const queryUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

        const queryRes = await fetch(queryUrl, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${adminToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: "users" }],
                    where: {
                        fieldFilter: {
                            field: { fieldPath: "email" },
                            op: "EQUAL",
                            value: { stringValue: toEmail }
                        }
                    },
                    limit: 1
                }
            })
        });

        if (!queryRes.ok) throw new Error("Failed to query receiver");
        const queryData = await queryRes.json();

        if (!queryData[0]?.document) {
            return NextResponse.json({ error: "找不到收款人" }, { status: 404 });
        }

        const receiverDocRaw = queryData[0].document;
        const receiverId = receiverDocRaw.name.split('/').pop();

        // 2. Run Transaction
        await runTransaction(adminToken, async (transaction) => {
            // Get Sender
            const senderDoc = await transaction.get("users", fromUid);
            if (!senderDoc.exists) throw "找不到匯款人";

            const senderPoints = Number(senderDoc.data.points || 0);
            if (senderPoints < amount) throw "點數不足";

            // Get Receiver (Already queried ID, but get fresh data in transaction)
            const receiverDoc = await transaction.get("users", receiverId);
            if (!receiverDoc.exists) throw "找不到收款人"; // Should exist

            const receiverPoints = Number(receiverDoc.data.points || 0);

            // Execute Transfer
            transaction.update("users", fromUid, {
                points: senderPoints - amount
            });

            transaction.update("users", receiverId, {
                points: receiverPoints + Number(amount)
            });

            // Log Transaction
            const newTxId = crypto.randomUUID();
            transaction.create("transactions", newTxId, {
                from: fromUid,
                to: receiverId,
                amount: Number(amount),
                type: "TRANSFER",
                createdAt: new Date()
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Transfer Error:", error);
        return NextResponse.json({ error: typeof error === 'string' ? error : "轉帳失敗" }, { status: 500 });
    }
}
