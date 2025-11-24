const https = require('https');

async function testTransaction() {
    const testUserId = 'EsfhGWjhS7a4it8l1S2eLvpYSmt2';
    const testCode = 'WAWAG-58B65488';

    console.log('\n=== Testing Transaction via API ===');

    const payload = JSON.stringify({
        codeId: testCode,
        uid: testUserId
    });

    const options = {
        hostname: 'wawag.pages.dev',
        port: 443,
        path: '/api/claim-code',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Response Body:', data);
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
    });

    req.write(payload);
    req.end();
}

testTransaction();
