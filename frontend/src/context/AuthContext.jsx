import React, { createContext, useContext, useState, useEffect } from 'react';

const TOKEN_KEY = 'cityfix_token';
const USER_KEY = 'cityfix_user';

// ── Dummy users (no backend needed) ─────────────────────────────────────────
const DEMO_USERS = [
  {
    uid: 'demo-citizen-001',
    name: 'Ravi Kumar',
    email: 'citizen@cityfix.com',
    password: 'citizen123',
    role: 'citizen',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi',
    zone: '',
    department: ''
  },
  {
    uid: 'demo-officer-001',
    name: 'Officer Prasad',
    email: 'officer@cityfix.com',
    password: 'officer123',
    role: 'officer',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Prasad',
    zone: 'Zone A',
    department: 'Roads & Infrastructure'
  },
  {
    uid: 'demo-admin-001',
    name: 'Admin Suresh',
    email: 'admin@cityfix.com',
    password: 'admin123',
    role: 'admin',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
    zone: '',
    department: ''
  }
];

function saveSession(userData) {
  localStorage.setItem(TOKEN_KEY, 'demo-token-' + userData.role);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session on app start
  useEffect(() => {
    const { user: savedUser } = loadSession();
    if (savedUser) {
      setUser(savedUser);
      setUserData(savedUser);
    }
    setLoading(false);
  }, []);

  // ── Google OAuth (demo mode — accepts any Google login) ──────────────────
  async function loginWithGoogleCredential(credentialResponse) {
    // In demo mode just log in as citizen with Google info
    const demoGoogleUser = {
      uid: 'google-demo-001',
      name: 'Google User',
      email: 'googleuser@gmail.com',
      role: 'citizen',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Google',
      zone: '',
      department: ''
    };

    setUser(demoGoogleUser);
    setUserData(demoGoogleUser);
    saveSession(demoGoogleUser);
    return demoGoogleUser;
  }

  // ── Email / Password login (checks against DEMO_USERS) ──────────────────
  async function loginWithEmailPassword(email, password) {
    // Find matching demo user
    const found = DEMO_USERS.find(
      u => u.email === email.toLowerCase().trim() &&
           u.password === password
    );

    if (!found) {
      throw new Error('Invalid email or password');
    }

    // Remove password before storing
    const { password: _, ...safeUser } = found;

    setUser(safeUser);
    setUserData(safeUser);
    saveSession(safeUser);
    return safeUser;
  }

  // ── Register (demo mode — just saves locally) ────────────────────────────
  async function registerUser(name, email, password, role = 'citizen') {
    const newUser = {
      uid: 'demo-' + Date.now(),
      name,
      email,
      role,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      zone: '',
      department: ''
    };

    setUser(newUser);
    setUserData(newUser);
    saveSession(newUser);
    return newUser;
  }

  // ── Refresh (no-op in demo mode) ─────────────────────────────────────────
  async function refreshUserData() {
    setLoading(false);
  }

  // ── Logout ────────────────────────────────────────────────────────────────
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