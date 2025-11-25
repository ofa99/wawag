// Mock the environment for the library
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = require('../firebase-service-account.json').project_id;
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "YOUR_API_KEY"; // Need to find this or assume it works if I can get token. 
// Actually, getAccessToken uses service account, so it doesn't need API KEY for that part.
// But getDocument uses FIRESTORE_URL which needs PROJECT_ID.
// verifyIdToken needs API_KEY. But we are skipping verifyIdToken here.

// We need to import the library functions. 
// Since they are ES modules, and I am in CommonJS node script, it's tricky.
// I'll copy the relevant logic into this script to test "fromFirestore".

const serviceAccount = require('../firebase-service-account.json');
const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

const PROJECT_ID = serviceAccount.project_id;

async function getAccessToken() {
    const auth = new GoogleAuth({
        credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform'],
    });
    return await auth.getAccessToken();
}

function fromFirestore(doc) {
    if (!doc || !doc.fields) return { id: doc?.name?.split('/').pop() };
    const obj = { id: doc.name.split('/').pop() };
    for (const [key, value] of Object.entries(doc.fields)) {
        obj[key] = parseValue(value);
    }
    return obj;
}

function parseValue(value) {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue);
    if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.timestampValue !== undefined) return value.timestampValue;
    if (value.nullValue !== undefined) return null;
    return value;
}

async function test() {
    const token = await getAccessToken();
    console.log("Got access token");

    const uid = 'EsfhGWjhS7a4it8l1S2eLvpYSmt2';
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;

    const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const json = await res.json();
    console.log("Raw Firestore JSON:", JSON.stringify(json, null, 2));

    const parsed = fromFirestore(json);
    console.log("Parsed Data:", parsed);

    console.log("Points:", parsed.points, "Type:", typeof parsed.points);
}

test().catch(console.error);
