import { NextResponse } from "next/server";

export const runtime = 'edge';

import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { getLevel } from "@/utils/calcLevel";

// Placeholder Admin List - In production, use custom claims or a database role field
const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export async function GET(request) {
    try {
        // 1. Basic Admin Verification (Header-based for now, or query param)
        // Since we don't have session management in API routes easily without cookies/headers
        // We will assume the client sends a 'x-admin-email' header for this phase as a simple check
        // In a real app, we would verify the Firebase Auth ID Token here.

        const adminEmail = request.headers.get("x-admin-email");

        if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch Users
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);

        const users = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const points = data.totalPointsEarned || data.points || 0; // Support both fields if legacy exists

            users.push({
                uid: doc.id,
                name: data.displayName || "Unknown",
                email: data.email || "",
                points: points,
                level: getLevel(points),
                monthlyGiftClaimedAt: data.monthlyGiftClaimedAt ? data.monthlyGiftClaimedAt.toDate().toISOString() : null,
                avatar: data.avatar || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${doc.id}`,
                updatedAt: data.updatedAt || null
            });
        });

        return NextResponse.json({ users });

    } catch (error) {
        console.error("Get Users Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
