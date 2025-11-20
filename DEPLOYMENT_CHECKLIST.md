# 🚀 Production Deployment Checklist (v1.0)

## 1. Firebase Configuration Check
- [ ] **Project ID**: Verify `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches the production project.
- [ ] **Auth Domain**: Ensure `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` is whitelisted in Firebase Console > Authentication > Settings > Authorized Domains.
- [ ] **API Key**: Confirm `NEXT_PUBLIC_FIREBASE_API_KEY` has appropriate restrictions (HTTP referrers) in Google Cloud Console.

## 2. Environment Variables (.env)
Ensure the following variables are set in Vercel (or your hosting provider):
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
# Admin Security (If implemented via Env)
ADMIN_EMAILS=admin@example.com,allenlu@example.com
```

## 3. Firestore Indexes
- [ ] **Composite Indexes**: Check the browser console or Vercel logs for "The query requires an index" errors.
    - *Potential Need*: If sorting Users by `points` AND filtering by `level` simultaneously.
    - *Current Status*: Basic queries used (Get All, Get by ID) likely do not require custom indexes yet.

## 4. SSR/CSR & Hydration
- [ ] **"use client"**: Verify all components using hooks (`useState`, `useEffect`, `useAuth`) have `"use client"` at the top.
- [ ] **Window Object**: Ensure no direct `window` access occurs outside `useEffect` to prevent server-side crashes.
- [ ] **Suspense**: Wrap async components or `useSearchParams` in `<Suspense>` if using Next.js 14 static generation features.

## 5. Vercel / Hosting Settings
- [ ] **Framework Preset**: Next.js
- [ ] **Build Command**: `npm run build` (or `next build`)
- [ ] **Output Directory**: `.next`
- [ ] **Node Version**: Node.js 18.x or 20.x (Recommended)
- [ ] **Region**: Select a region close to your Firestore location (e.g., `asia-east1` if Firestore is in Taiwan) to minimize latency.

## 6. Domain & SSL
- [ ] **DNS Records**: Configure A/CNAME records for your custom domain.
- [ ] **Firebase Auth**: Add your custom domain (e.g., `app.wawag.com`) to Firebase Console > Authentication > Settings > Authorized Domains to allow Google Sign-In to work correctly.

---

# 📦 Release Notes v1.0 - "Macaron Launch" 🧸

**Release Date**: 2025-11-20
**Status**: Stable Production Release

### ✨ New Features
*   **Macaron UI System**: A complete visual overhaul with pastel colors, glassmorphism cards, and bouncy animations.
*   **Gamified Dashboard**: Real-time level progress, daily check-in bonuses, and VIP tier tracking.
*   **Points Engine**: Robust backend logic for earning, transferring, and redeeming points.
*   **VIP System**: Automatic level calculation (LV.1 - LV.10) with exclusive monthly rewards for LV.7+.
*   **Admin Panel**: Secure interface for managing members and manually adjusting points.
*   **Letter Collection Event**: Interactive "Draw & Collect" game with "WAWAG" redemption mechanics.

### 🛠 Technical Improvements
*   **Performance**: Optimized `onSnapshot` usage for real-time updates without excessive reads.
*   **Security**: Basic Admin verification via headers (Ready for RBAC upgrade).
*   **UX**: Enhanced feedback with Toast notifications and Optimistic UI updates.

### 🐛 Known Issues / Limitations
*   **Admin Auth**: Currently relies on email whitelist; recommended to upgrade to Custom Claims for v1.1.
*   **Scanner**: UI exists but requires physical hardware integration for full functionality.

---
*Ready for Deployment*
