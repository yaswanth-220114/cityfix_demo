import express from 'express';
import { register, login, googleAuth, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.post('/register', register);       // email/password signup
router.post('/login', login);             // email/password login
router.post('/google', googleAuth);       // Google OAuth
router.get('/me', protect, getMe);        // get logged in user (protected)

export default router;