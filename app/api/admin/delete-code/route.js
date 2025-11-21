import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, getDoc } from "firebase/firestore";

export const runtime = 'edge';


// Placeholder Admin List
const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export async function DELETE(request) {
    try {
        const adminEmail = request.headers.get("x-admin-email");
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "未經授權" }, { status: 401 });
        }

        if (!id) {
            return NextResponse.json({ error: "缺少代碼 ID" }, { status: 400 });
        }

        const codeRef = doc(db, "codes", id);
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists()) {
            return NextResponse.json({ error: "找不到代碼" }, { status: 404 });
        }

        await deleteDoc(codeRef);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete Code Error:", error);
        return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
    }
}
