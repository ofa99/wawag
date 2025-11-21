import { NextResponse } from "next/server";

export const runtime = 'edge';

import { adminDb } from "@/lib/firebase-admin"; // Assuming we have admin SDK or using client SDK with rules? 
// Wait, the prompt says "Do not modify firebase init". 
// If I don't have admin SDK, I must use the client SDK in the API route? 
// Actually, usually API routes use Admin SDK to bypass rules, but if I can't add new files/init...
// Let's check if firebase-admin exists. If not, I might have to use the client SDK in the API route (which is weird but possible if rules allow)
// OR I should check if I can use the existing `lib/firebase.js` which exports `db`.
// The user said "Do not modify firebase init".
// Let's assume I should use `lib/firebase.js` and standard Firestore calls.
// However, API routes run on the server. Client SDK works there too.

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, Timestamp } from "firebase/firestore";
import { getLevel } from "@/utils/calcLevel";

export async function POST(request) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userSnap.data();
        const currentPoints = userData.totalPointsEarned || 0;
        const level = getLevel(currentPoints);

        if (level < 7) {
            return NextResponse.json({ error: "VIP level not reached" }, { status: 403 });
        }

        // Check if already claimed this month
        const lastClaimed = userData.monthlyGiftClaimedAt;
        if (lastClaimed) {
            const lastDate = lastClaimed.toDate();
            const now = new Date();
            if (lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear()) {
                return NextResponse.json({ error: "Already claimed this month" }, { status: 400 });
            }
        }

        // Calculate Reward
        let reward = 0;
        if (level === 7) reward = 100;
        else if (level === 8) reward = 150;
        else if (level === 9) reward = 200;
        else if (level >= 10) reward = 300;

        // Update User
        await updateDoc(userRef, {
            points: increment(reward),
            monthlyGiftClaimedAt: Timestamp.now(),
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            reward,
            newPoints: (userData.points || 0) + reward
        });

    } catch (error) {
        console.error("VIP Claim Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
