import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, Timestamp } from "firebase/firestore";
import { getLevel } from "@/utils/calcLevel";

export const runtime = 'edge';


export async function POST(request) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "需要使用者 ID" }, { status: 400 });
        }

        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
        }

        const userData = userSnap.data();
        const currentPoints = userData.totalPointsEarned || 0;
        const level = getLevel(currentPoints);

        if (level < 7) {
            return NextResponse.json({ error: "未達到 VIP 等級" }, { status: 403 });
        }

        // Check if already claimed this month
        const lastClaimed = userData.monthlyGiftClaimedAt;
        if (lastClaimed) {
            const lastDate = lastClaimed.toDate();
            const now = new Date();
            if (lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear()) {
                return NextResponse.json({ error: "本月已領取" }, { status: 400 });
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
        return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
    }
}
