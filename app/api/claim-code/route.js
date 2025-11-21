import { NextResponse } from "next/server";

export const runtime = 'edge';

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, increment, serverTimestamp, runTransaction } from "firebase/firestore";

export async function POST(request) {
    try {
        const body = await request.json();
        const { codeId, uid } = body;

        if (!codeId || !uid) {
            return NextResponse.json({ success: false, message: "Missing codeId or uid" }, { status: 400 });
        }

        // Use Transaction for atomicity
        const result = await runTransaction(db, async (transaction) => {
            // 1. Find the code document
            const codesRef = collection(db, "codes");
            const q = query(codesRef, where("codeId", "==", codeId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("Invalid code");
            }

            const codeDoc = querySnapshot.docs[0];
            const codeData = codeDoc.data();

            // 2. Check if used
            if (codeData.isUsed) {
                throw new Error("Code already used");
            }

            // 3. Update User Points
            const userRef = doc(db, "users", uid);
            transaction.update(userRef, {
                points: increment(codeData.points),
                totalPointsEarned: increment(codeData.points),
                updatedAt: serverTimestamp()
            });

            // 4. Mark Code as Used
            const codeDocRef = doc(db, "codes", codeDoc.id);
            transaction.update(codeDocRef, {
                isUsed: true,
                usedAt: serverTimestamp(),
                usedBy: uid // Optional: Track who used it
            });

            return codeData.points;
        });

        return NextResponse.json({ success: true, points: result });

    } catch (error) {
        console.error("Claim Code Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
