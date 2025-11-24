import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/serviceAccountAuth";
import { runTransaction, getCollection } from "@/lib/firestoreRest";

export const runtime = 'edge';

export async function POST(request) {
    try {
        const { code, uid } = await request.json();

        if (!code || !uid) {
            return NextResponse.json({ error: "無效的請求" }, { status: 400 });
        }

        const adminToken = await getAccessToken();

        // 1. Find the code document ID first (Query)
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
                    from: [{ collectionId: "codes" }],
                    where: {
                        fieldFilter: {
                            field: { fieldPath: "codeId" },
                            op: "EQUAL",
                            value: { stringValue: code }
                        }
                    },
                    limit: 1
                }
            })
        });

        if (!queryRes.ok) throw new Error("Failed to query code");
        const queryData = await queryRes.json();

        if (!queryData[0]?.document) {
            return NextResponse.json({ error: "無效的代碼" }, { status: 404 });
        }

        const codeDocRaw = queryData[0].document;
        const codeId = codeDocRaw.name.split('/').pop();

        // 2. Run Transaction
        await runTransaction(adminToken, async (transaction) => {
            // Read Code Doc
            const codeDoc = await transaction.get("codes", codeId);
            if (!codeDoc.exists) throw "Code not found";

            if (codeDoc.data.isUsed) {
                throw new Error("代碼已使用");
            }

            // Read User Doc
            const userDoc = await transaction.get("users", uid);

            // Calculate new points
            const pointsToAdd = Number(codeDoc.data.points || 0);
            const currentPoints = userDoc.exists ? (userDoc.data.points || 0) : 0;
            const currentTotal = userDoc.exists ? (userDoc.data.totalPointsEarned || 0) : 0;

            // Update Code
            transaction.update("codes", codeId, {
                isUsed: true,
                usedBy: uid,
                usedAt: new Date()
            });

            // Update/Create User
            if (userDoc.exists) {
                transaction.update("users", uid, {
                    points: currentPoints + pointsToAdd,
                    totalPointsEarned: currentTotal + pointsToAdd,
                    updatedAt: new Date()
                });
            } else {
                transaction.set("users", uid, {
                    email: "",
                    points: pointsToAdd,
                    totalPointsEarned: pointsToAdd,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            // Create Transaction Record
            const newTxId = crypto.randomUUID();
            transaction.create("transactions", newTxId, {
                uid: uid,
                amount: pointsToAdd,
                type: "QR_CODE",
                codeId: code,
                description: "QR Code Redemption",
                createdAt: new Date()
            });
        });

        return NextResponse.json({ success: true, points: 0 });

    } catch (error) {
        console.error("Claim Code Error:", error);
        const message = error.message || "伺服器錯誤";
        return NextResponse.json({ error: message }, { status: message === "代碼已使用" ? 400 : 500 });
    }
}
