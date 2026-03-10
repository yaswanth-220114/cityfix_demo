import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const TOKEN_KEY = 'cityfix_token';
const USER_KEY = 'cityfix_user';

// Save both token and user object
function saveSession(token, userData) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (userData) localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

function loadSession() {
    try {
        const rawUser = localStorage.getItem(USER_KEY);
        const token = localStorage.getItem(TOKEN_KEY);
        return { user: rawUser ? JSON.parse(rawUser) : null, token };
    } catch {
        return { user: null, token: null };
    }
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Ensure local shape matches frontend needs by mapping backend "_id" to "uid"
function buildUser(backendUser) {
    return {
        uid: backendUser.id || backendUser._id || backendUser.uid,
        name: backendUser.name || '',
        email: backendUser.email || '',
        photoURL: backendUser.photoURL || '',
        role: backendUser.role || 'citizen',
        zone: backendUser.zone || '',
        department: backendUser.department || ''
    };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial check on load
    useEffect(() => {
        const { user: savedUser, token } = loadSession();

        if (savedUser && token) {
            setUser(savedUser);
            setUserData(savedUser);
            // Optionally, we could immediately ask backend /auth/me for fresh data,
            // but we'll run it quietly in background so it doesn't block rendering
            refreshUserData();
        } else {
            setLoading(false);
        }
    }, []);

    // ── Google OAuth endpoint in Express backend ──────────────────────────────
    async function loginWithGoogleCredential(credentialResponse) {
        const decoded = jwtDecode(credentialResponse.credential);

        // Let the backend register or login the user via POST /api/auth/google
        const response = await api.post('/auth/google', {
            name: decoded.name,
            email: decoded.email,
            googleId: decoded.sub,
            photoURL: decoded.picture
        });

        const { token, user: backendUser } = response.data;
        const normalized = buildUser(backendUser);

        setUser(normalized);
        setUserData(normalized);
        saveSession(token, normalized);

        return normalized;
    }

    // ── Regular email / password login in Express backend ───────────────────
    async function loginWithEmailPassword(email, password) {
        // Issue a POST command to /api/auth/login
        const response = await api.post('/auth/login', { email, password });

        const { token, user: backendUser } = response.data;
        const normalized = buildUser(backendUser);

        setUser(normalized);
        setUserData(normalized);
        saveSession(token, normalized);

        return normalized;
    }

    // ── Handle new user registration in Express Backend ─────────────────────
    async function registerUser(name, email, password, role = 'citizen') {
        const response = await api.post('/auth/register', { name, email, password, role });

        const { token, user: backendUser } = response.data;
        const normalized = buildUser(backendUser);

        setUser(normalized);
        setUserData(normalized);
        saveSession(token, normalized);

        return normalized;
    }

    // ── Check if session is valid by hitting the /auth/me endpoint ─────────
    const refreshUserData = async () => {
        try {
            const response = await api.get('/auth/me'); // uses token automatically
            const backendUser = response.data.user;
            const normalized = buildUser(backendUser);

            setUser(normalized);
            setUserData(normalized);

            // Only update the user object (don't erase token)
            localStorage.setItem(USER_KEY, JSON.stringify(normalized));
        } catch (error) {
            console.error("Session refresh failed or token expired:", error.message);
            logout(); // Clear obsolete/corrupted tokens
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearSession();
        setUser(null);
        setUserData(null);
    };

    return (
        <AuthContext.Provider value={{
            user, userData, loading,
            loginWithGoogleCredential,
            loginWithEmailPassword,
            registerUser,
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
