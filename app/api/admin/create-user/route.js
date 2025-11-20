import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const ADMIN_EMAILS = ["admin@example.com", "allenlu@example.com"];

export async function POST(request) {
    try {
        // Verify admin authorization
        const adminEmail = request.headers.get("x-admin-email");
        if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Check if Admin SDK is initialized
        if (!adminAuth || !adminDb) {
            return NextResponse.json({
                error: "Firebase Admin SDK not initialized. Please configure service account credentials."
            }, { status: 500 });
        }

        const { name, email, password } = await request.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        // Create Firebase Auth user
        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: name,
        });

        // Create Firestore user document
        await adminDb.collection("users").doc(userRecord.uid).set({
            displayName: name,
            email: email,
            points: 0,
            totalPointsEarned: 0,
            vipStatus: false,
            monthlyGiftClaimedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${userRecord.uid}`,
        });

        return NextResponse.json({
            success: true,
            uid: userRecord.uid,
            message: "User created successfully"
        });

    } catch (error) {
        console.error("Create User Error:", error);

        // Handle specific Firebase errors
        if (error.code === "auth/email-already-exists") {
            return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }
        if (error.code === "auth/invalid-email") {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }
        if (error.code === "auth/weak-password") {
            return NextResponse.json({ error: "Password is too weak" }, { status: 400 });
        }

        return NextResponse.json({
            error: error.message || "Failed to create user"
        }, { status: 500 });
    }
}
