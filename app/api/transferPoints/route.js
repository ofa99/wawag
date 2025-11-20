import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, runTransaction, collection, query, where, getDocs } from "firebase/firestore";

export async function POST(request) {
    const { fromUid, toEmail, amount } = await request.json();

    if (!fromUid || !toEmail || !amount || amount < 10) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get Sender
            const senderRef = doc(db, "users", fromUid);
            const senderDoc = await transaction.get(senderRef);
            if (!senderDoc.exists()) throw "Sender not found";

            const senderData = senderDoc.data();
            if (senderData.points < amount) throw "Insufficient points";

            // 2. Get Receiver by Email
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", toEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) throw "Receiver not found";
            const receiverDoc = querySnapshot.docs[0];
            const receiverRef = doc(db, "users", receiverDoc.id);

            // 3. Execute Transfer
            transaction.update(senderRef, { points: senderData.points - amount });
            transaction.update(receiverRef, { points: (receiverDoc.data().points || 0) + Number(amount) });

            // 4. Log Transaction
            const txRef = doc(collection(db, "transactions"));
            transaction.set(txRef, {
                from: fromUid,
                to: receiverDoc.id,
                amount: Number(amount),
                type: "TRANSFER",
                createdAt: new Date().toISOString()
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: typeof error === 'string' ? error : "Transfer failed" }, { status: 500 });
    }
}
