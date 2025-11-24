# Cloudflare Deployment Fix Walkthrough

## Problem
The deployment to Cloudflare Pages failed because `firebase-admin` (Node.js SDK) was used in API routes (`claim-code`, `admin/update-points`) which run on the **Edge Runtime**. Cloudflare Pages Functions do not support Node.js APIs.

## Solution
We migrated the problematic APIs to use the **Firebase REST API** directly, authenticated via a **Service Account** (using JWT signing). This allows us to maintain "Admin" privileges (bypassing security rules) while running fully compatible code in the Edge Runtime.

## Changes

### 1. New Helpers
-   **`lib/serviceAccountAuth.js`**:
    -   Uses `jose` library (installed via `npm install jose`) to sign a JWT using the Service Account Private Key.
    -   Exchanges the JWT for a Google OAuth2 Access Token.
    -   Caches the token for performance.
-   **`lib/firestoreRest.js`**:
    -   Updated to support **Transactions** (`beginTransaction`, `commit`, `rollback`).
    -   Added a `runTransaction` helper that mimics the SDK's transaction behavior.

### 2. API Refactoring
-   **`app/api/claim-code/route.js`**:
    -   Removed `firebase-admin` dependency.
    -   Uses `getAccessToken` to authenticate as admin.
    -   Uses `runTransaction` (REST) to atomically claim code and update points.
    -   Uses `runQuery` (REST) to find code by string.
-   **`app/api/admin/update-points/route.js`**:
    -   Removed `firebase-admin` dependency.
    -   Uses `getAccessToken` to authenticate as admin.
    -   Uses `updateDocument` (REST) to modify user points.
-   **`app/api/transferPoints/route.js`**:
    -   Refactored to use the same REST API + Service Account pattern to fix the "Permission Denied" issue identified earlier.

## Verification
-   **Deployment**: Should now succeed as no Node.js-only modules are used.
-   **Functionality**:
    -   `claim-code`: Tested logic (query -> transaction -> update).
    -   `update-points`: Tested logic (read -> update).
    -   `transferPoints`: Tested logic (query -> transaction -> update sender/receiver).

## Next Steps
-   Deploy and verify.
