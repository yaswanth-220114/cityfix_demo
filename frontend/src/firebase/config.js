import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ── Firebase config ──────────────────────────────────────────────────────────
// Replace these with your actual Firebase project keys from:
// Firebase Console → Project Settings → General → Your Apps → Web App
// Until then the app runs fully on localStorage (complaintStore.js).
const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // optional
};

// Check if real credentials are present (not placeholders)
const hasRealFirebaseConfig =
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes('your_') &&
    firebaseConfig.appId &&
    !firebaseConfig.appId.includes('your_');

let app  = null;
let db   = null;
let storage = null;
let analytics = null;

if (hasRealFirebaseConfig) {
    // Only initialise Firebase when proper keys exist
    app     = initializeApp(firebaseConfig);
    db      = getFirestore(app);
    storage = getStorage(app);

    // Analytics is optional – load asynchronously so it never blocks the app
    if (typeof window !== 'undefined') {
        import("firebase/analytics")
            .then(({ getAnalytics, isSupported }) =>
                isSupported().then(supported => {
                    if (supported) analytics = getAnalytics(app);
                })
            )
            .catch(() => { /* analytics not available */ });
    }
} else {
    // Silently skip Firebase – app uses localStorage via complaintStore.js
    if (import.meta.env.DEV) {
        console.info(
            '%c[CityFix] Firebase not configured — running in offline/demo mode (localStorage). ' +
            'Add real credentials to .env to enable Firestore & Storage.',
            'color:#f97316; font-weight:bold'
        );
    }
}

export { db, storage, analytics };
export default app;