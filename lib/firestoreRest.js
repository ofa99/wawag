
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!PROJECT_ID) console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!API_KEY) console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`;

/**
 * Verify ID Token and get user info (email, uid)
 */
export async function verifyIdToken(token) {
    try {
        const res = await fetch(AUTH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Token verification failed");

        return data.users[0]; // { localId, email, ... }
    } catch (error) {
        console.error("Auth Error:", error);
        return null;
    }
}

/**
 * Convert Firestore JSON format to regular JSON
 */
export function fromFirestore(doc) {
    if (!doc || !doc.fields) return { id: doc?.name?.split('/').pop() };

    const obj = { id: doc.name.split('/').pop() };

    for (const [key, value] of Object.entries(doc.fields)) {
        obj[key] = parseValue(value);
    }

    // Add metadata if needed
    if (doc.createTime) obj.createdAt = doc.createTime;
    if (doc.updateTime) obj.updatedAt = doc.updateTime;

    return obj;
}

function parseValue(value) {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue);
    if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.timestampValue !== undefined) return value.timestampValue;
    if (value.nullValue !== undefined) return null;
    if (value.mapValue !== undefined) {
        const map = {};
        for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
            map[k] = parseValue(v);
        }
        return map;
    }
    if (value.arrayValue !== undefined) {
        return (value.arrayValue.values || []).map(parseValue);
    }
    return value;
}

/**
 * Convert regular JSON to Firestore JSON format
 */
export function toFirestore(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'id') continue; // Skip ID
        const formatted = formatValue(value);
        if (formatted) fields[key] = formatted;
    }
    return { fields };
}

function formatValue(value) {
    if (value === null) return { nullValue: null };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return { integerValue: value.toString() };
        return { doubleValue: value };
    }
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(formatValue).filter(v => v) } };
    }
    if (typeof value === 'object') {
        return { mapValue: { fields: toFirestore(value).fields } };
    }
    return undefined;
}

/**
 * Fetch documents from a collection
 */
export async function getCollection(collectionName, token) {
    const res = await fetch(`${FIRESTORE_URL}/${collectionName}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to fetch collection");
    }

    const data = await res.json();
    return (data.documents || []).map(fromFirestore);
}

/**
 * Fetch a single document
 */
export async function getDocument(collectionName, docId, token) {
    const res = await fetch(`${FIRESTORE_URL}/${collectionName}/${docId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
        if (res.status === 404) {
            return null; // Document doesn't exist
        }
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to fetch document");
    }

    const data = await res.json();
    return fromFirestore(data);
}

/**
 * Create a document
 */
export async function createDocument(collectionName, data, token, docId = null) {
    const url = docId
        ? `${FIRESTORE_URL}/${collectionName}?documentId=${docId}`
        : `${FIRESTORE_URL}/${collectionName}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(toFirestore(data))
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to create document");
    }

    return fromFirestore(await res.json());
}

/**
 * Update a document (Patch)
 */
export async function updateDocument(collectionName, docId, data, token) {
    // Construct updateMask to avoid overwriting entire document if not intended
    // But for simplicity in this helper, we'll just patch the fields provided.
    // Firestore REST API PATCH requires specifying updateMask for partial updates 
    // OR it merges by default? REST API merges by default if no mask is provided but it's tricky.
    // Actually, standard PATCH replaces the document unless updateMask is present.

    // Let's build the query params for updateMask
    const keys = Object.keys(data);
    const queryParams = keys.map(k => `updateMask.fieldPaths=${k}`).join('&');

    const res = await fetch(`${FIRESTORE_URL}/${collectionName}/${docId}?${queryParams}`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(toFirestore(data))
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to update document");
    }

    return fromFirestore(await res.json());
}

/**
 * Delete a document
 */
export async function deleteDocument(collectionName, docId, token) {
    const res = await fetch(`${FIRESTORE_URL}/${collectionName}/${docId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to delete document");
    }

    return true;
}
