import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export const runtime = 'edge';


const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export async function POST(request) {
    try {
        // Verify admin authorization
        const adminEmail = request.headers.get("x-admin-email");
        if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "未經授權" }, { status: 403 });
        }

        const { name, email, password } = await request.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json({ error: "需要姓名、Email 和密碼" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "密碼必須至少 6 個字元" }, { status: 400 });
        }

        // 1. Create User via Firebase Auth REST API
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

        const signUpRes = await fetch(signUpUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true
            })
        });

        const signUpData = await signUpRes.json();

        if (!signUpRes.ok) {
            throw new Error(signUpData.error?.message || "在 Auth 中建立使用者失敗");
        }

        const uid = signUpData.localId;
        const idToken = signUpData.idToken;

        // 2. Update Profile (Display Name)
        const updateProfileUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`;
        await fetch(updateProfileUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idToken,
                displayName: name,
                returnSecureToken: false
            })
        });

        // 3. Create Firestore Document (Using Client SDK which works on Edge)
        await setDoc(doc(db, "users", uid), {
            uid: uid,
            displayName: name,
            email: email,
            points: 0,
            totalPointsEarned: 0,
            vipStatus: false,
            monthlyGiftClaimedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${uid}`,
        });

        return NextResponse.json({
            success: true,
            uid: uid,
            message: "使用者建立成功"
        });

    } catch (error) {
        console.error("Create User Error:", error);
        return NextResponse.json({
            error: error.message || "建立使用者失敗"
        }, { status: 500 });
    }
}
