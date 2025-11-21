import { NextResponse } from "next/server";
import { verifyIdToken, updateDocument } from "@/lib/firestoreRest";

export const runtime = 'edge';

export async function POST(request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const userInfo = await verifyIdToken(token);

        if (!userInfo) {
            return NextResponse.json({ error: "無效的 Token" }, { status: 403 });
        }

        const { displayName, photoURL, phone, lineId } = await request.json();

        console.log("Update profile request:", { displayName, photoURL, phone, lineId, uid: userInfo.uid });

        if (!displayName) {
            return NextResponse.json({ error: "顯示名稱為必填" }, { status: 400 });
        }

        // Update user document
        const updateData = {
            displayName,
            updatedAt: new Date()
        };

        // Update both photoURL and avatar for compatibility
        if (photoURL) {
            updateData.photoURL = photoURL;
            updateData.avatar = photoURL; // Also update avatar field
        }
        if (phone !== undefined) updateData.phone = phone;
        if (lineId !== undefined) updateData.lineId = lineId;

        console.log("Updating document with data:", updateData);

        await updateDocument("users", userInfo.uid, updateData, token);

        console.log("Profile updated successfully for user:", userInfo.uid);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ error: `伺服器錯誤: ${error.message}` }, { status: 500 });
    }
}
