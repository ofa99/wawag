import { NextResponse } from "next/server";
import { adminDb, admin } from "@/lib/firebase-admin";

// Admin SDK requires Node.js runtime, not Edge
// export const runtime = 'edge'; 

export async function POST(request) {
    try {
        const body = await request.json();
        const { codeId, uid } = body;

        if (!codeId || !uid) {
            return NextResponse.json({ success: false, message: "缺少代碼 ID 或使用者 ID" }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ success: false, message: "Server Error: Admin SDK not initialized" }, { status: 500 });
        }

        // 1. Find the code document (Query first to get ID)
        const codesRef = adminDb.collection("codes");
        const snapshot = await codesRef.where("codeId", "==", codeId).get();

        if (snapshot.empty) {
            return NextResponse.json({ success: false, message: "無效的代碼" }, { status: 400 });
        }

        const codeDocSnapshot = snapshot.docs[0];
        const codeDocId = codeDocSnapshot.id;

        // Use Transaction for atomicity
        const result = await adminDb.runTransaction(async (transaction) => {
            const codeDocRef = adminDb.collection("codes").doc(codeDocId);
            const userRef = adminDb.collection("users").doc(uid);

            const codeDoc = await transaction.get(codeDocRef);
            const userDoc = await transaction.get(userRef);

            if (!codeDoc.exists) {
                throw new Error("無效的代碼");
            }

            const codeData = codeDoc.data();

            // 2. Check if used
            if (codeData.isUsed) {
                throw new Error("代碼已使用");
            }

            // 3. Update or Create User Points
            if (!userDoc.exists) {
                transaction.set(userRef, {
                    points: codeData.points,
                    totalPointsEarned: codeData.points,
                    level: 1,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    uid: uid
                });
            } else {
                transaction.update(userRef, {
                    points: admin.firestore.FieldValue.increment(codeData.points),
                    totalPointsEarned: admin.firestore.FieldValue.increment(codeData.points),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            // 4. Mark Code as Used
            transaction.update(codeDocRef, {
                isUsed: true,
                usedAt: admin.firestore.FieldValue.serverTimestamp(),
                usedBy: uid
            });

            // 5. Create Transaction Record
            const txRef = adminDb.collection("transactions").doc(crypto.randomUUID());
            transaction.set(txRef, {
                uid,
                amount: codeData.points,
                type: "QR_CODE",
                codeId: codeId,
                description: `兌換代碼: ${codeId}`,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return codeData.points;
        });

        return NextResponse.json({ success: true, points: result });

    } catch (error) {
        console.error("Claim Code Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
