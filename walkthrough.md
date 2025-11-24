# QR Code Scanning Fix Walkthrough

## Problem
The user reported that:
1.  Scanning QR codes (especially via image upload) would hang on "Processing..."
2.  Points were not being transferred.
3.  **New Request**: Wanted a success modal instead of a toast, and redirection to the dashboard.
4.  **New Issue**: Points were 0 even after redemption (likely due to missing user document).
5.  **New Request**: Specific error modal when a code has already been redeemed.

## Changes

### Frontend (`app/(dashboard)/scan/page.jsx`)
-   **URL Parsing**: Added logic to detect if the scanned text is a URL.
-   **Safety Timeout**: Added a 10-second timeout to reset the `isProcessing` state.
-   **Success Modal**: Replaced the simple toast notification with a "Congratulations" modal showing the earned points.
-   **Error Modal**: Added a specific "Code Already Used" modal. If the API returns "代碼已使用", this modal appears instead of a generic error toast.
-   **Redirection**:
    -   Success -> Redirects to `/dashboard`.
    -   Error (Used Code) -> Reloads the page (resets scanner) upon confirmation.

### Backend (`app/api/claim-code/route.js`)
-   **Race Condition Fix**: Refactored transaction logic.
-   **User Document Creation**: Modified the transaction to check if the user's document exists. If not, it creates the document with the earned points.
-   **Single Redemption**: Verified that the backend logic `if (codeData.isUsed) throw new Error("代碼已使用")` correctly enforces single use.

## Verification
-   **UX Flow (Success)**: Scan -> Success Modal -> Click Confirm -> Redirect to Dashboard -> See updated points.
-   **UX Flow (Used Code)**: Scan Used Code -> Error Modal ("此獎已經被兌換過") -> Click Confirm -> Page Reloads -> Ready to scan again.
-   **Data Integrity**: Codes cannot be double-spent.

## Next Steps
-   Deploy changes.
-   Ask user to test both success and duplicate redemption scenarios.
