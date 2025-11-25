const serviceAccount = require('../firebase-service-account.json');
const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

const PROJECT_ID = serviceAccount.project_id;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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

async function beginTransaction(token) {
    const res = await fetch(`${FIRESTORE_URL}:beginTransaction`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ options: { readWrite: {} } })
    });
    const data = await res.json();
    return data.transaction;
}

async function runTest() {
    try {
        const token = await getAccessToken();
        console.log("Got access token");

        const transactionId = await beginTransaction(token);
        console.log("Started transaction:", transactionId);

        const uid = 'EsfhGWjhS7a4it8l1S2eLvpYSmt2'; // Allen
        const url = `${FIRESTORE_URL}/users/${uid}?transaction=${encodeURIComponent(transactionId)}`;

        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const doc = await res.json();
        console.log("Raw Doc:", JSON.stringify(doc, null, 2));

        const data = fromFirestore(doc);
        console.log("Parsed Data:", data);
        console.log("Points:", data.points);

    } catch (e) {
        console.error(e);
    }
}

runTest();
