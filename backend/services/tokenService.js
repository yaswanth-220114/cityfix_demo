import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token.
 * @param {string} id  - MongoDB user _id
 * @param {string} [expiresIn] - e.g. '7d', '1h'
 */
export const generateToken = (id, expiresIn = process.env.JWT_EXPIRES_IN || '7d') =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
