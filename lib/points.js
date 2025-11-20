import { db } from "@/lib/firebase";
import { doc, runTransaction, getDoc } from "firebase/firestore";
import { calculateLevel } from "@/utils/calcLevel";

export async function addPoints(uid, amount, type = "BONUS") {
    try {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", uid);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw "User does not exist!";
            }

            const userData = userDoc.data();
            const newPoints = (userData.points || 0) + amount;
            const newTotal = (userData.totalPointsEarned || 0) + (amount > 0 ? amount : 0);
            const newLevel = calculateLevel(newTotal);

            transaction.update(userRef, {
                points: newPoints,
                totalPointsEarned: newTotal,
                level: newLevel,
                lastActivity: new Date().toISOString()
            });

            // Log transaction
            const txRef = doc(db, "transactions", crypto.randomUUID());
            transaction.set(txRef, {
                uid,
                amount,
                type,
                createdAt: new Date().toISOString()
            });
        });
        return { success: true };
    } catch (error) {
        console.error("Error adding points:", error);
        return { success: false, error };
    }
}
