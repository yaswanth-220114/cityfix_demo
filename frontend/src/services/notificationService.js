import API from '../config/api.js';

// Get all notifications for logged in user
export const getNotifications = async () => {
    const res = await API.get('/notifications');
    return res.data;
};

// Mark single notification as read
export const markAsRead = async (id) => {
    const res = await API.put(`/notifications/${id}/read`);
    return res.data;
};

// Mark all notifications as read
export const markAllRead = async () => {
    const res = await API.put('/notifications/read-all');
    return res.data;
};