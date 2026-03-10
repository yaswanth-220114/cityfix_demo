// ─── CityFix Complaint Store (localStorage) ──────────────────────────────────
// Used as the primary data layer when Firebase is not configured.
// To migrate to MongoDB/Firebase later: replace each exported function body
// with the corresponding API call – everything else (UI, routing) stays the same.

const KEY = 'cityfix_complaints';
const NOTIF_KEY_PREFIX = 'cityfix_notifs_';

// ── Helpers ───────────────────────────────────────────────────────────────────
const read = (k, fallback = []) => {
    try {
        const raw = localStorage.getItem(k);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
};
const write = (k, data) => localStorage.setItem(k, JSON.stringify(data));

// Generate a short readable ID
const genId = () => `CF-${Date.now().toString(36).toUpperCase()}`;

// ── Complaints ────────────────────────────────────────────────────────────────

/** Save a new complaint submitted by a citizen. Returns the saved complaint object. */
export const saveComplaint = (complaint) => {
    const existing = getComplaints();
    const newComplaint = {
        ...complaint,
        id: genId(),
        complaintId: genId(),
        status: 'submitted',
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        officerId: null,
        officerName: null,
        timeline: [
            {
                status: 'submitted',
                message: 'Complaint received and registered',
                time: new Date().toISOString(),
                by: complaint.citizenId || 'citizen',
            },
        ],
    };
    write(KEY, [...existing, newComplaint]);
    return newComplaint;
};

/** Get every complaint in the store. */
export const getComplaints = () => read(KEY);

/** Get complaints filed by a specific citizen (matched by citizenId OR citizenEmail). */
export const getCitizenComplaints = (citizenIdOrEmail) => {
    return getComplaints().filter(
        c => c.citizenId === citizenIdOrEmail || c.citizenEmail === citizenIdOrEmail
    );
};

/** Get complaints assigned to a specific officer (matched by officerId OR uid). */
export const getOfficerComplaints = (officerIdOrUid) => {
    return getComplaints().filter(
        c => c.officerId === officerIdOrUid
    );
};

/** Get a single complaint by ID. Returns null if not found. */
export const getComplaintById = (id) => {
    return getComplaints().find(c => c.id === id || c.complaintId === id) || null;
};

/**
 * Update status of a complaint.
 * @param {string} complaintId
 * @param {string} status  - 'in-progress' | 'resolved' | 'assigned' | etc.
 * @param {string} note    - Officer note/message
 * @param {string} updatedBy - Officer uid or name
 * @param {object|null} proofData - Optional { url, name } proof image
 */
export const updateComplaintStatus = (complaintId, status, note, updatedBy, proofData = null) => {
    const complaints = getComplaints();
    const updated = complaints.map(c => {
        if (c.id !== complaintId && c.complaintId !== complaintId) return c;
        const timelineEntry = {
            status,
            message: note || `Status changed to ${status}`,
            time: new Date().toISOString(),
            by: updatedBy,
            ...(proofData ? { proof: proofData } : {}),
        };
        return {
            ...c,
            status,
            resolvedAt: status === 'resolved' ? new Date().toISOString() : c.resolvedAt,
            timeline: [...(c.timeline || []), timelineEntry],
        };
    });
    write(KEY, updated);
};

/**
 * Assign a complaint to an officer — also sets status to 'assigned'.
 */
export const assignComplaint = (complaintId, officerId, officerName = '') => {
    const complaints = getComplaints();
    const updated = complaints.map(c => {
        if (c.id !== complaintId && c.complaintId !== complaintId) return c;
        return {
            ...c,
            officerId,
            officerName,
            status: 'assigned',
            timeline: [...(c.timeline || []), {
                status: 'assigned',
                message: `Complaint assigned to officer${officerName ? ': ' + officerName : ''}`,
                time: new Date().toISOString(),
                by: 'admin',
            }],
        };
    });
    write(KEY, updated);
};

/** Escalate a complaint — adds `escalated: true` flag and a timeline entry. */
export const escalateComplaint = (complaintId, adminNote = '') => {
    const complaints = getComplaints();
    const updated = complaints.map(c => {
        if (c.id !== complaintId && c.complaintId !== complaintId) return c;
        return {
            ...c,
            escalated: true,
            escalatedAt: new Date().toISOString(),
            escalationNote: adminNote,
            timeline: [...(c.timeline || []), {
                status: 'escalated',
                message: adminNote || 'Escalated to admin for review',
                time: new Date().toISOString(),
                by: 'officer',
            }],
        };
    });
    write(KEY, updated);
};

/** Compute live stats from localStorage data. */
export const getLiveStats = () => {
    const complaints = getComplaints();
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const resolvedThisWeek = complaints.filter(c => {
        if (!c.resolvedAt) return false;
        return new Date(c.resolvedAt) >= oneWeekAgo;
    }).length;

    const resolvedWithTime = complaints.filter(c => c.resolvedAt && c.createdAt);
    const avgResolutionHours = resolvedWithTime.length > 0
        ? Math.round(
            resolvedWithTime.reduce((acc, c) => {
                const created = new Date(c.createdAt);
                const res = new Date(c.resolvedAt);
                return acc + (res - created) / (1000 * 60 * 60);
            }, 0) / resolvedWithTime.length
        )
        : 0;

    return { total, resolved, resolvedThisWeek, avgResolutionHours, open: total - resolved };
};

// ── Notifications (localStorage) ─────────────────────────────────────────────

/** Create a notification for a user (citizen, officer, or admin). */
export const createNotification = (userId, data) => {
    if (!userId) return;
    const key = NOTIF_KEY_PREFIX + userId;
    const existing = read(key, []);
    write(key, [
        { id: Date.now().toString(), ...data, read: false, timestamp: new Date().toISOString() },
        ...existing,
    ]);
};

/** Get notifications for a user. Returns array newest-first. */
export const getNotifications = (userId) => {
    return read(NOTIF_KEY_PREFIX + userId, []).slice(0, 20);
};

/** Mark a single notification as read. */
export const markNotificationRead = (userId, notifId) => {
    const key = NOTIF_KEY_PREFIX + userId;
    const notifs = read(key, []).map(n =>
        n.id === notifId ? { ...n, read: true } : n
    );
    write(key, notifs);
};

/** Mark all notifications for a user as read. */
export const markAllNotificationsRead = (userId) => {
    const key = NOTIF_KEY_PREFIX + userId;
    const notifs = read(key, []).map(n => ({ ...n, read: true }));
    write(key, notifs);
};

// ── Users / Officers (local demo data) ───────────────────────────────────────

const USERS_KEY = 'cityfix_users';

/** Get all users from localStorage (seeded from dummyUsers on first run). */
export const getAllUsers = () => {
    const stored = read(USERS_KEY, null);
    if (stored) return stored;
    // Seed from dummyUsers on first call
    const seed = [
        { id: 'dummy_1', uid: 'dummy_1', name: 'Ravi Kumar', email: 'citizen@cityfix.com', role: 'citizen', zone: '' },
        { id: 'dummy_2', uid: 'dummy_2', name: 'Officer Prasad', email: 'officer@cityfix.com', role: 'officer', zone: 'Central Zone' },
        { id: 'dummy_3', uid: 'dummy_3', name: 'Admin Suresh', email: 'admin@cityfix.com', role: 'admin', zone: '' },
    ];
    write(USERS_KEY, seed);
    return seed;
};

/** Get only officers. */
export const getAllOfficers = () => getAllUsers().filter(u => u.role === 'officer');

/** Update a user's role and zone. */
export const updateUserRole = (uid, role, zone = '') => {
    const users = getAllUsers().map(u =>
        (u.id === uid || u.uid === uid) ? { ...u, role, zone } : u
    );
    write(USERS_KEY, users);
};
