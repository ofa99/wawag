import { importPKCS8, SignJWT } from 'jose';

const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;

// Cache the token
let cachedToken = null;
let tokenExpiry = 0;

export async function getAccessToken() {
    if (!PRIVATE_KEY || !CLIENT_EMAIL) {
        throw new Error("Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL");
    }

    // Return cached token if valid (with 1 min buffer)
    if (cachedToken && Date.now() < tokenExpiry - 60000) {
        return cachedToken;
    }

    try {
        const alg = 'RS256';
        const pkcs8 = await importPKCS8(PRIVATE_KEY, alg);

        const jwt = await new SignJWT({
            scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform'
        })
            .setProtectedHeader({ alg })
            .setIssuer(CLIENT_EMAIL)
            .setSubject(CLIENT_EMAIL)
            .setAudience('https://oauth2.googleapis.com/token')
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(pkcs8);

        const params = new URLSearchParams();
        params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
        params.append('assertion', jwt);

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Failed to get access token: ${JSON.stringify(err)}`);
        }

        const data = await res.json();
        cachedToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in * 1000);

        return cachedToken;
    } catch (error) {
        console.error("Error getting access token:", error);
        throw error;
    }
}
