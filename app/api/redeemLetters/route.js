import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";

export const runtime = 'edge';


const REWARD = 500;
const REQUIRED = { W: 2, A: 2, G: 1 }; // WAWAG

export async function POST(request) {
    const { uid } = await request.json();

    try {
        await runTransaction(db, async (transaction) => {
            const letterRef = doc(db, "userLetters", uid);
            const letterDoc = await transaction.get(letterRef);

            if (!letterDoc.exists()) throw "No letters found";
            const letters = letterDoc.data();

            // Check requirements
            if ((letters.W || 0) < 2 || (letters.A || 0) < 2 || (letters.G || 0) < 1) {
                throw "Not enough letters for WAWAG";
            }

            // Deduct letters
            transaction.update(letterRef, {
                W: letters.W - 2,
                A: letters.A - 2,
                G: letters.G - 1
            });

            // Add Reward
            const userRef = doc(db, "users", uid);
            const userDoc = await transaction.get(userRef);
            const newPoints = (userDoc.data().points || 0) + REWARD;

            transaction.update(userRef, { points: newPoints });
        });

        return NextResponse.json({ success: true, reward: REWARD });
    } catch (error) {
        return NextResponse.json({ error: error.toString() }, { status: 400 });
    }
}
