import { NextResponse } from "next/server";

export const runtime = 'edge';

import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export async function POST(request) {
    try {
        // Verify admin authorization
        const adminEmail = request.headers.get("x-admin-email");
        if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { name, email, password } = await request.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
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
            throw new Error(signUpData.error?.message || "Failed to create user in Auth");
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
            message: "User created successfully"
        });

    } catch (error) {
        console.error("Create User Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to create user"
        }, { status: 500 });
    }
}
