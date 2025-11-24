import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, increment, serverTimestamp, runTransaction } from "firebase/firestore";

export const runtime = 'edge';


export async function POST(request) {
    try {
        const body = await request.json();
        const { codeId, uid } = body;

        if (!codeId || !uid) {
            return NextResponse.json({ success: false, message: "缺少代碼 ID 或使用者 ID" }, { status: 400 });
        }

        // 1. Find the code document (Query first to get ID)
        const codesRef = collection(db, "codes");
        const q = query(codesRef, where("codeId", "==", codeId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ success: false, message: "無效的代碼" }, { status: 400 });
        }

        const codeDocSnapshot = querySnapshot.docs[0];
        const codeDocId = codeDocSnapshot.id;

        // Use Transaction for atomicity
        const result = await runTransaction(db, async (transaction) => {
            const codeDocRef = doc(db, "codes", codeDocId);
            const codeDoc = await transaction.get(codeDocRef);

            if (!codeDoc.exists()) {
                throw new Error("無效的代碼");
            }

            const codeData = codeDoc.data();

            // 2. Check if used
            if (codeData.isUsed) {
                throw new Error("代碼已使用");
            }

            // 3. Update User Points
            const userRef = doc(db, "users", uid);
            transaction.update(userRef, {
                points: increment(codeData.points),
                totalPointsEarned: increment(codeData.points),
                updatedAt: serverTimestamp()
            });

            // 4. Mark Code as Used
            transaction.update(codeDocRef, {
                isUsed: true,
                usedAt: serverTimestamp(),
                usedBy: uid
            });

            return codeData.points;
        });

        return NextResponse.json({ success: true, points: result });

    } catch (error) {
        console.error("Claim Code Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
