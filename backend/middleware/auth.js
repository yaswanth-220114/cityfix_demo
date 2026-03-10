import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect a route — requires a valid JWT in Authorization header.
 * Attaches req.user = { id, role } on success.
 */
export const protect = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorised — no token' });
    }

    try {
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) return res.status(401).json({ message: 'User not found' });
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Restrict access to specific roles.
 * Usage: router.get('/admin-only', protect, requireRole('admin'))
 */
export const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return res.status(403).json({ message: `Access denied — requires role: ${roles.join(' or ')}` });
    }
    next();
};
