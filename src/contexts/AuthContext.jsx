import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { dummyUsers } from '../data/dummyUsers';

// ─── Firestore helpers are loaded lazily at runtime (never at module level) ───
// This prevents a Firebase config error from crashing the whole app on load.
let firestoreCreateUser = null;
let firestoreGetUser = null;

async function loadFirestore() {
    try {
        const fs = await import('../firebase/firestore');
        firestoreCreateUser = fs.createOrUpdateUser;
        firestoreGetUser = fs.getUserData;
    } catch (e) {
        console.warn('Firebase not available – running in demo/offline mode.', e.message);
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const LS_KEY = 'cityfix_user';

function saveSession(userData) {
    localStorage.setItem(LS_KEY, JSON.stringify(userData));
}
function loadSession() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
function clearSession() {
    localStorage.removeItem(LS_KEY);
}

// Build a normalised user object
function buildUser({ uid, name, email, picture, role = 'citizen', zone = '', provider = 'google' }) {
    return { uid, name, email, photoURL: picture || '', role, zone, provider };
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);   // same shape as before
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount + lazy-load Firebase
    useEffect(() => {
        // Load Firestore in the background – never block render
        loadFirestore();

        const saved = loadSession();
        if (saved) {
            setUser(saved);
            setUserData(saved);
        }
        setLoading(false);
    }, []);

    // ── Persist to Firestore (best-effort) ──────────────────────────────────
    async function syncToFirestore(userData) {
        if (!firestoreCreateUser) return;
        try {
            await firestoreCreateUser(userData.uid, {
                name: userData.name,
                email: userData.email,
                photoURL: userData.photoURL,
                role: userData.role,
                zone: userData.zone,
            });
            const fresh = await firestoreGetUser(userData.uid);
            if (fresh) {
                const merged = { ...userData, role: fresh.role, zone: fresh.zone || '' };
                setUser(merged);
                setUserData(merged);
                saveSession(merged);
            }
        } catch { /* offline – keep local role */ }
    }

    // ── Google OAuth credential handler (called by LoginPage after Google resolves) ──
    async function loginWithGoogleCredential(credentialResponse) {
        const decoded = jwtDecode(credentialResponse.credential);
        const uid = decoded.sub;
        const built = buildUser({
            uid,
            name: decoded.name,
            email: decoded.email,
            picture: decoded.picture,
            role: 'citizen',
        });
        setUser(built);
        setUserData(built);
        saveSession(built);
        // Sync / fetch real role from Firestore
        await syncToFirestore(built);
        return built;
    }

    // ── Dummy email/password login ───────────────────────────────────────────
    async function loginWithEmailPassword(email, password) {
        const found = dummyUsers.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!found) throw new Error('Invalid email or password');

        const built = buildUser({
            uid: `dummy_${found.id}`,
            name: found.name,
            email: found.email,
            picture: found.avatar,
            role: found.role,
            provider: 'email',
        });
        setUser(built);
        setUserData(built);
        saveSession(built);
        return built;
    }

    // ── Logout ───────────────────────────────────────────────────────────────
    const logout = () => {
        clearSession();
        setUser(null);
        setUserData(null);
    };

    // ── Refresh user data from Firestore ─────────────────────────────────────
    const refreshUserData = async () => {
        if (!user || !firestoreGetUser) return;
        try {
            const fresh = await firestoreGetUser(user.uid);
            if (fresh) {
                const updated = { ...user, role: fresh.role, zone: fresh.zone || '' };
                setUser(updated);
                setUserData(updated);
                saveSession(updated);
            }
        } catch { }
    };

    return (
        <AuthContext.Provider value={{
            user, userData, loading,
            loginWithGoogleCredential,
            loginWithEmailPassword,
            logout,
            refreshUserData,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
