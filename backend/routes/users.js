import express from 'express';
import User from '../models/User.js';
import { protect, restrictTo as requireRole } from '../middleware/authmiddleware.js';

const router = express.Router();

// ── GET /api/users — admin gets all users ─────────────────────────────────────
router.get('/', protect, requireRole('admin'), async (_req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET /api/users/officers — list all officers ──────────────────────────────
router.get('/officers', protect, requireRole('admin'), async (_req, res) => {
    try {
        const officers = await User.find({ role: 'officer' }).select('-password');
        res.json(officers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── POST /api/users — admin creates an officer account ───────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
    try {
        const { name, email, password, zone } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Name, email and password are required' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already registered' });

        const user = await User.create({ name, email, password, role: 'officer', zone: zone || '' });
        res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, zone: user.zone });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── PATCH /api/users/:id/role — admin promotes/demotes a user ────────────────
router.patch('/:id/role', protect, requireRole('admin'), async (req, res) => {
    try {
        const { role, zone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, zone: zone || '' },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
