
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

/**
 * Transaction Support
 */

export async function beginTransaction(token) {
    const res = await fetch(`${FIRESTORE_URL}:beginTransaction`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            options: {
                readWrite: {}
            }
        })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to begin transaction");
    }

    const data = await res.json();
    return data.transaction;
}

export async function commitTransaction(transactionId, writes, token) {
    const res = await fetch(`${FIRESTORE_URL}:commit`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            transaction: transactionId,
            writes: writes
        })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to commit transaction");
    }

    return await res.json();
}

export async function rollbackTransaction(transactionId, token) {
    // Firestore REST API doesn't strictly require rollback, transaction expires.
    // But we can implement it if needed. The API is :rollback
    await fetch(`${FIRESTORE_URL}:rollback`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            transaction: transactionId
        })
    });
}

/**
 * Helper to run a transaction similar to SDK
 * @param {Function} updateFunction - async (transaction) => { ... }
 * transaction object passed to updateFunction will have:
 * - get(collection, docId)
 * - update(collection, docId, data)
 * - set(collection, docId, data)
 * - delete(collection, docId)
 */
export async function runTransaction(token, updateFunction) {
    const transactionId = await beginTransaction(token);
    const writes = [];

    const transaction = {
        get: async (collectionName, docId) => {
            const res = await fetch(`${FIRESTORE_URL}/${collectionName}/${docId}?transaction=${transactionId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.status === 404) return { exists: false, data: null, id: docId };
            if (!res.ok) throw new Error("Failed to get document in transaction");
            const doc = await res.json();
            return { exists: true, data: fromFirestore(doc), id: docId, _raw: doc };
        },
        // Query support in transaction is tricky via REST (runQuery with transaction), skipping for now unless needed.
        // We can do get by ID easily.

        update: (collectionName, docId, data) => {
            // Transform data to writes
            // For update, we use 'update' operation
            const fields = toFirestore(data).fields;
            const updateMask = { fieldPaths: Object.keys(data) };

            writes.push({
                update: {
                    name: `projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${docId}`,
                    fields: fields
                },
                updateMask: updateMask,
                currentDocument: { exists: true } // Ensure document exists
            });
        },
        set: (collectionName, docId, data, options = {}) => {
            const fields = toFirestore(data).fields;
            // If merge is true, it's an update/upsert? REST API 'update' acts as upsert if no currentDocument constraint?
            // Actually, 'update' with no existence constraint is upsert.
            // But 'update' replaces if no mask?
            // Let's stick to simple 'update' (upsert/replace) logic.

            // If creating new doc with auto ID, docId should be provided by caller or generated.
            // If docId is null, we can't easily put it in 'writes' array without knowing ID.
            // Caller must provide ID for transaction writes usually.

            if (!docId) {
                // Generate a random ID? Or throw.
                // For transactions, we usually know the ID.
                // If we need auto-id, we can generate one client-side.
                // Let's assume docId is provided.
            }

            writes.push({
                update: {
                    name: `projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${docId}`,
                    fields: fields
                }
                // No updateMask = replace
            });
        },
        create: (collectionName, docId, data) => {
            const fields = toFirestore(data).fields;
            writes.push({
                update: {
                    name: `projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${docId}`,
                    fields: fields
                },
                currentDocument: { exists: false } // Ensure it doesn't exist
            });
        },
        delete: (collectionName, docId) => {
            writes.push({
                delete: `projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${docId}`
            });
        }
    };

    try {
        await updateFunction(transaction);
        await commitTransaction(transactionId, writes, token);
    } catch (error) {
        await rollbackTransaction(transactionId, token);
        throw error;
    }
}
