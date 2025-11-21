import { NextResponse } from "next/server";
import { verifyIdToken, getCollection } from "@/lib/firestoreRest";
import { getLevel } from "@/utils/calcLevel";

export const runtime = 'edge';

const ADMIN_EMAILS = ["abc@gmail.com", "allenlu@example.com"];

export async function GET(request) {
    try {
        // 1. Verify Admin Token
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const userInfo = await verifyIdToken(token);

        if (!userInfo || !ADMIN_EMAILS.includes(userInfo.email)) {
            return NextResponse.json({ error: "未經授權" }, { status: 403 });
        }

        // 2. Fetch Users via REST API
        // We reuse the admin's token to make the request to Firestore
        // This works because the admin user has permission in Security Rules
        const rawUsers = await getCollection("users", token);

        const users = rawUsers.map(data => {
            // The original code calculated 'points' and 'level' based on 'totalPointsEarned' or 'points'.
            // The new structure spreads 'data' and then explicitly sets 'points' and 'level',
            // potentially overriding values from 'data' if they are falsy.
            // It also adds 'isAdmin' and 'createdAt' fields.

            // If data.totalPointsEarned is preferred for points calculation,
            // it should be calculated before spreading `data` or explicitly set after.
            // For now, we'll follow the provided snippet's logic for points and level.
            const points = data.totalPointsEarned || data.points || 0;

            return {
                uid: data.id, // Assuming data.id is the correct UID, as 'doc' is not defined.
                ...data, // Spreads all properties from the Firestore document
                // Ensure numeric values, potentially overriding values from `...data` if they are falsy
                points: points, // Use the calculated points
                level: getLevel(points), // Use the calculated level
                isAdmin: data.isAdmin || false, // Include isAdmin field
                // Format dates if they exist
                createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : null,
                monthlyGiftClaimedAt: data.monthlyGiftClaimedAt || null,
                avatar: data.avatar || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${data.id}`,
                updatedAt: data.updatedAt || null
            };
        });

        return NextResponse.json({ users });

    } catch (error) {
        console.error("Get Users Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
