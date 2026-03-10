import API from '../config/api.js';

// Register with email/password
export const register = async (name, email, password, role) => {
  const res = await API.post('/auth/register', { name, email, password, role });
  return res.data;
};

// Login with email/password
export const login = async (email, password) => {
  const res = await API.post('/auth/login', { email, password });
  return res.data;
};

// Google OAuth login
export const googleLogin = async (googleUser) => {
  const res = await API.post('/auth/google', {
    name: googleUser.name,
    email: googleUser.email,
    googleId: googleUser.sub,
    photoURL: googleUser.picture
  });
  return res.data;
};

// Get current user
export const getMe = async () => {
  const res = await API.get('/auth/me');
  return res.data;
};

// Logout
export const logout = () => {
  localStorage.removeItem('cityfix_token');
  localStorage.removeItem('cityfix_user');
  window.location.href = '/login';
};