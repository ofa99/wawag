import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";

export const runtime = 'edge';


const LETTERS = ["W", "A", "G"];
const COST = 50;

export async function POST(request) {
    const { uid } = await request.json();

    try {
        const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", uid);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) throw "找不到使用者";
            if ((userDoc.data().points || 0) < COST) throw "點數不足";

            // Deduct points
            transaction.update(userRef, {
                points: userDoc.data().points - COST
            });

            // Add letter
            const letterRef = doc(db, "userLetters", uid);
            const letterDoc = await transaction.get(letterRef);

            const currentLetters = letterDoc.exists() ? letterDoc.data() : {};
            const newCount = (currentLetters[letter] || 0) + 1;

            transaction.set(letterRef, {
                ...currentLetters,
                [letter]: newCount
            });
        });

        return NextResponse.json({ success: true, letter });
    } catch (error) {
        return NextResponse.json({ error: error.toString() }, { status: 500 });
    }
}
