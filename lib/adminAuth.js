import { getDocument } from "./firestoreRest";

const ADMIN_EMAILS = ["abc@gmail.com", "allenlu@example.com"];

/**
 * Check if a user is an admin by checking both hardcoded emails and Firestore isAdmin field
 */
export async function isUserAdmin(userInfo, token) {
    try {
        // 1. Check hardcoded list first (fast path)
        if (ADMIN_EMAILS.includes(userInfo.email)) {
            return true;
        }

        // 2. Check Firestore for isAdmin field
        const userDoc = await getDocument("users", userInfo.uid || userInfo.localId, token);

        if (!userDoc) {
            return false;
        }

        // Parse the Firestore response
        const isAdmin = userDoc.fields?.isAdmin?.booleanValue === true;

        return isAdmin;
    } catch (error) {
        console.error("Error checking admin status:", error);
        // On error, fall back to hardcoded list only
        return ADMIN_EMAILS.includes(userInfo.email);
    }
}
