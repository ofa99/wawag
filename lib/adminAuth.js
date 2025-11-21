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
        const uid = userInfo.uid || userInfo.localId;
        const userData = await getDocument("users", uid, token);

        if (!userData) {
            console.log("User document not found for:", uid);
            return false;
        }

        // getDocument already converts the data, so we can access isAdmin directly
        const isAdmin = userData.isAdmin === true;

        console.log("Admin check for", userInfo.email, ":", isAdmin);

        return isAdmin;
    } catch (error) {
        console.error("Error checking admin status:", error);
        // On error, fall back to hardcoded list only
        return ADMIN_EMAILS.includes(userInfo.email);
    }
}
