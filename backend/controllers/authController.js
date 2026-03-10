import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── POST /api/auth/register ──────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already registered' });

        const user = await User.create({ name, email, password, role: role || 'citizen' });

        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id, name: user.name,
                email: user.email, role: user.role,
                photoURL: user.photoURL, zone: user.zone,
                department: user.department
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id, name: user.name,
                email: user.email, role: user.role,
                photoURL: user.photoURL, zone: user.zone,
                department: user.department
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/auth/google ────────────────────────────────────────────────────
export const googleAuth = async (req, res) => {
    try {
        const { name, email, googleId, photoURL } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            // New user → create with citizen role by default
            user = await User.create({ name, email, googleId, photoURL, role: 'citizen' });
        } else {
            // Existing user → update google info
            user.googleId = googleId;
            user.photoURL = photoURL;
            await user.save();
        }

        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id, name: user.name,
                email: user.email, role: user.role,
                photoURL: user.photoURL, zone: user.zone,
                department: user.department
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            success: true,
            user: {
                id: user._id, name: user.name,
                email: user.email, role: user.role,
                photoURL: user.photoURL, zone: user.zone,
                department: user.department
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};