# QR Code Scanning Fix Walkthrough

## Problem
The user reported that:
1.  Scanning QR codes (especially via image upload) would hang on "Processing..."
2.  Points were not being transferred.

This was likely due to:
-   **URL in QR Code**: The QR code might contain a full URL (e.g., `https://.../CODE`) instead of just the code ID. The backend would fail to find this exact string, and potentially the error handling wasn't robust enough.
-   **State Hanging**: If the API call failed or took too long, the `isProcessing` state might not have been reset, locking the UI.

## Changes

### Frontend (`app/(dashboard)/scan/page.jsx`)
-   **URL Parsing**: Added logic to detect if the scanned text is a URL. If so, it attempts to extract the code ID from the path or query parameters.
-   **Safety Timeout**: Added a 10-second timeout to automatically reset the `isProcessing` state and resume the scanner if the API call hangs.
-   **Logging**: Added console logs to help debug what is actually being scanned.

### Backend (`app/api/claim-code/route.js`)
-   **Race Condition Fix**: (Previously applied) Refactored the transaction logic to ensure atomic updates and prevent double-claiming.

## Verification
-   **Image Upload**: Uploading an image with a QR code (even if it's a URL) should now correctly extract the code ID.
-   **Timeout**: If the network is slow or the API hangs, the "Processing..." state will automatically reset after 10 seconds, allowing the user to try again.
-   **Manual Code Entry**: Remains available as a fallback.

## Next Steps
-   Ask the user to try scanning the image again.
-   If it still fails, ask them to check the console logs (if possible) or try the manual input with the code seen in the image (e.g., `WAWAG-ED21A8D0`).
