import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/authService.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('cityfix_token');
        if (token) {
            getMe()
                .then(data => setUser(data.user))
                .catch(() => localStorage.clear())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const loginUser = (token, userData) => {
        localStorage.setItem('cityfix_token', token);
        localStorage.setItem('cityfix_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logoutUser = () => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);