import API from '../config/api.js';

// Submit new complaint
export const submitComplaint = async (formData) => {
    const res = await API.post('/complaints/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } // for file upload
    });
    return res.data;
};

// Get my complaints (citizen)
export const getMyComplaints = async () => {
    const res = await API.get('/complaints/my');
    return res.data;
};

// Get all complaints (officer/admin)
export const getAllComplaints = async (filters = {}) => {
    const res = await API.get('/complaints/all', { params: filters });
    return res.data;
};

// Get single complaint details
export const getComplaintById = async (id) => {
    const res = await API.get(`/complaints/${id}`);
    return res.data;
};

// Update complaint status (officer)
export const updateStatus = async (id, status, note) => {
    const res = await API.put(`/complaints/${id}/status`, { status, note });
    return res.data;
};

// Assign complaint to officer (admin)
export const assignComplaint = async (complaintId, officerId) => {
    const res = await API.put(`/complaints/${complaintId}/assign`, { officerId });
    return res.data;
};