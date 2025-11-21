import { NextResponse } from "next/server";
import { addPoints } from "@/lib/points";

export const runtime = 'edge';


export async function POST(request) {
    const { uid, amount, type } = await request.json();

    if (!uid || !amount) {
        return NextResponse.json({ error: "缺少欄位" }, { status: 400 });
    }

    const result = await addPoints(uid, amount, type);

    if (result.success) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: "增加點數失敗" }, { status: 500 });
    }
}
