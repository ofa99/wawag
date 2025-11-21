// lib/firebase-admin.js
import admin from 'firebase-admin';


let app;

if (!admin.apps.length) {
    // Use environment variables (Compatible with Cloudflare/Vercel)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
        app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });

        console.log('✅ Firebase Admin SDK initialized with environment variables');
    } else {
        console.warn('⚠️ Firebase Admin SDK not initialized: Missing environment variables');
    }
} else {
    app = admin.app();
}

export const adminAuth = app ? admin.auth() : null;
export const adminDb = app ? admin.firestore() : null;
export { admin };
