import Notification from '../models/Notification.js';

/**
 * Create an in-app notification for a user.
 * @param {string} userId
 * @param {object} payload  { message, complaintId, type }
 */
export const notify = async (userId, { message, complaintId = '', type = 'status_update' }) => {
    try {
        await Notification.create({ userId, message, complaintId, type });
    } catch (err) {
        console.error('[notificationService] Failed to create notification:', err.message);
    }
};
