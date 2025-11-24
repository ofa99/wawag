# QR Code Scanning Fix Walkthrough

## Problem
The user reported that:
1.  Scanning QR codes (especially via image upload) would hang on "Processing..."
2.  Points were not being transferred.
3.  **New Request**: Wanted a success modal instead of a toast, and redirection to the dashboard.
4.  **New Issue**: Points were 0 even after redemption (likely due to missing user document).

## Changes

### Frontend (`app/(dashboard)/scan/page.jsx`)
-   **URL Parsing**: Added logic to detect if the scanned text is a URL.
-   **Safety Timeout**: Added a 10-second timeout to reset the `isProcessing` state.
-   **Success Modal**: Replaced the simple toast notification with a "Congratulations" modal showing the earned points.
-   **Redirection**: The modal has a "Confirm" button that redirects the user to `/dashboard`.

### Backend (`app/api/claim-code/route.js`)
-   **Race Condition Fix**: Refactored transaction logic.
-   **User Document Creation**: Modified the transaction to check if the user's document exists. If not (e.g., first time user or incomplete setup), it creates the document with the earned points instead of failing silently or throwing an error on `update`.

## Verification
-   **UX Flow**: Scan -> Success Modal -> Click Confirm -> Redirect to Dashboard -> See updated points.
-   **Data Integrity**: Even if a user has no prior record in the `users` collection, redeeming a code will now correctly initialize their account with points.

## Next Steps
-   Deploy changes.
-   Ask user to test the full flow.
