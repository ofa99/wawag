# QR Code Scanning Fix Walkthrough

## Problem
The user reported that they could not scan QR codes to redeem points. The issue was likely due to:
1.  **Frontend Scanner Issues**: `Html5QrcodeScanner` lifecycle management in React `useEffect` was fragile, potentially causing initialization errors or permission issues.
2.  **API Race Condition**: The `claim-code` API had a race condition where multiple concurrent requests could claim the same code.

## Changes

### Frontend (`app/(dashboard)/scan/page.jsx`)
-   **Robust Lifecycle Management**: Improved `useEffect` cleanup to ensure the scanner is properly cleared when the component unmounts.
-   **Manual Input Fallback**: Added a manual input field so users can type the code if the camera fails or permissions are denied.
-   **Better State Handling**: Added `isProcessing` state to prevent multiple submissions and manage scanner pause/resume during API calls.
-   **UI Improvements**: Added a visual separator and improved the layout.

### Backend (`app/api/claim-code/route.js`)
-   **Race Condition Fix**: Refactored the transaction logic.
    -   Previously, the code queried the document *outside* the transaction lock (implicitly via `getDocs` which is not transactional), then updated it.
    -   Now, it queries the document ID first, then performs a `transaction.get()` on that specific document ID to ensure the read is locked and atomic. This prevents double-claiming.

## Verification
-   **Manual Code Entry**: Users can now manually enter the code if scanning fails.
-   **Scanner Stability**: The scanner should now handle component mounts/unmounts more gracefully.
-   **Data Integrity**: The API now prevents double-spending of codes.

## Next Steps
-   Ask the user to test the scanning functionality on their device.
-   If scanning still fails (e.g., due to specific browser/device restrictions), the manual input serves as a reliable backup.
