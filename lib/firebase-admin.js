// lib/firebase-admin.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

let app;

if (!admin.apps.length) {
    // Check if we have a service account path
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
        try {
            // Read and parse the service account JSON file
            const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8');
            const serviceAccount = JSON.parse(serviceAccountFile);

            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });

            console.log('✅ Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        }
    } else {
        // Fallback: Use environment variables (for production deployment)
        // This requires FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, etc.
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
            console.warn('⚠️ Firebase Admin SDK not initialized: Missing service account credentials');
        }
    }
} else {
    app = admin.app();
}

export const adminAuth = app ? admin.auth() : null;
export const adminDb = app ? admin.firestore() : null;
export { admin };
