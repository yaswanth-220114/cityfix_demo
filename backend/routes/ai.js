import express from 'express';
const router = express.Router();

// AI routes will be added later
router.get('/test', (req, res) => {
    res.json({ message: 'AI routes working!' });
});

export default router;