import { NextResponse } from "next/server";

export const runtime = 'edge';

import { db } from "@/lib/firebase";
import { doc, deleteDoc, getDoc } from "firebase/firestore";

// Placeholder Admin List
const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export async function DELETE(request) {
    try {
        const adminEmail = request.headers.get("x-admin-email");
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!id) {
            return NextResponse.json({ error: "Missing code ID" }, { status: 400 });
        }

        const codeRef = doc(db, "codes", id);
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists()) {
            return NextResponse.json({ error: "Code not found" }, { status: 404 });
        }

        await deleteDoc(codeRef);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete Code Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
