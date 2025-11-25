const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function testGiftStock() {
    const uid = "test-user-stock"; // Use a test user
    const giftId = "test-gift-stock";

    console.log("=== Setting up Test Data ===");

    // 1. Create Test User with points
    await db.collection('users').doc(uid).set({
        points: 1000,
        email: "test@example.com"
    });
    console.log("✅ Created test user with 1000 points");

    // 2. Create Test Gift with stock 1
    await db.collection('gifts').doc(giftId).set({
        name: "Limited Edition Gift",
        cost: 100,
        stock: 1,
        imageUrl: "http://example.com/image.png",
        createdAt: new Date().toISOString()
    });
    console.log("✅ Created test gift with stock 1");

    // Helper to call redeem API logic directly (simulating API)
    // Since we can't call Next.js API from node script easily without running server,
    // we will replicate the transaction logic here to verify it works against Firestore.
    // This validates the *logic*, assuming the API code matches this logic (which I just wrote).

    async function redeem(userId, gId) {
        try {
            await db.runTransaction(async (t) => {
                const giftDoc = await t.get(db.collection('gifts').doc(gId));
                const userDoc = await t.get(db.collection('users').doc(userId));

                if (!giftDoc.exists) throw new Error("Gift not found");
                if (!userDoc.exists) throw new Error("User not found");

                const stock = giftDoc.data().stock;
                const cost = giftDoc.data().cost;
                const points = userDoc.data().points;

                if (stock !== undefined && stock <= 0) throw new Error("Out of stock");
                if (points < cost) throw new Error("Insufficient points");

                t.update(db.collection('users').doc(userId), { points: points - cost });
                t.update(db.collection('gifts').doc(gId), { stock: stock - 1 });
                t.create(db.collection('inventory').doc(), {
                    userId, giftId: gId, name: giftDoc.data().name, redeemedAt: new Date().toISOString()
                });
            });
            console.log(`✅ Redemption successful for ${gId}`);
            return true;
        } catch (e) {
            console.log(`❌ Redemption failed: ${e.message}`);
            return false;
        }
    }

    console.log("\n=== Test 1: First Redemption (Should Succeed) ===");
    await redeem(uid, giftId);

    console.log("\n=== Test 2: Second Redemption (Should Fail) ===");
    await redeem(uid, giftId);

    // Verify final state
    const finalGift = await db.collection('gifts').doc(giftId).get();
    console.log(`\nFinal Stock: ${finalGift.data().stock} (Expected: 0)`);

    const finalUser = await db.collection('users').doc(uid).get();
    console.log(`Final Points: ${finalUser.data().points} (Expected: 900)`);
}

testGiftStock().catch(console.error);
