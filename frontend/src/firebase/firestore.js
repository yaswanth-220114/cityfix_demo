import {
    collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc,
    query, where, orderBy, limit, onSnapshot, serverTimestamp,
    arrayUnion, increment, Timestamp
} from 'firebase/firestore';
import { db } from './config';

// ─── Users ───────────────────────────────────────────────────────────────────

export async function createOrUpdateUser(uid, data) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, {
            ...data,
            role: 'citizen',
            createdAt: serverTimestamp(),
        });
    }
    return (await getDoc(ref)).data();
}

export async function getUserData(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserRole(uid, role, zone = '') {
    await updateDoc(doc(db, 'users', uid), { role, zone });
}

export async function getAllOfficers() {
    const q = query(collection(db, 'users'), where('role', '==', 'officer'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Complaints ────────────────────────────────────────────────────────────

export async function submitComplaint(data) {
    const complaintId = `CF-${Date.now().toString(36).toUpperCase()}`;
    const ref = doc(db, 'complaints', complaintId);
    await setDoc(ref, {
        ...data,
        complaintId,
        status: 'submitted',
        timeline: [{
            status: 'submitted',
            message: 'Complaint submitted successfully',
            timestamp: Timestamp.now(),
            by: data.citizenId,
        }],
        aiScore: data.aiScore || 5,
        createdAt: serverTimestamp(),
        resolvedAt: null,
        officerId: null,
    });
    return complaintId;
}

export async function getComplaint(id) {
    const snap = await getDoc(doc(db, 'complaints', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getComplaintsByCitizen(citizenId) {
    const q = query(
        collection(db, 'complaints'),
        where('citizenId', '==', citizenId),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllComplaints(filters = {}) {
    let q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (filters.status) results = results.filter(c => c.status === filters.status);
    if (filters.category) results = results.filter(c => c.category === filters.category);
    if (filters.severity) results = results.filter(c => c.severity === filters.severity);
    if (filters.officerId) results = results.filter(c => c.officerId === filters.officerId);

    return results;
}

export async function getComplaintsByOfficer(officerId) {
    const q = query(
        collection(db, 'complaints'),
        where('officerId', '==', officerId),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateComplaintStatus(complaintId, status, note, updatedBy, resolutionProof = null) {
    const updates = {
        status,
        [`timeline`]: arrayUnion({
            status,
            message: note,
            timestamp: Timestamp.now(),
            by: updatedBy,
            ...(resolutionProof ? { proof: resolutionProof } : {}),
        }),
    };
    if (status === 'resolved') {
        updates.resolvedAt = serverTimestamp();
    }
    await updateDoc(doc(db, 'complaints', complaintId), updates);
}

export async function assignComplaint(complaintId, officerId) {
    await updateDoc(doc(db, 'complaints', complaintId), {
        officerId,
        status: 'assigned',
        timeline: arrayUnion({
            status: 'assigned',
            message: `Complaint assigned to officer`,
            timestamp: Timestamp.now(),
            by: 'system',
        }),
    });
}

export async function escalateComplaint(complaintId, adminNote) {
    await updateDoc(doc(db, 'complaints', complaintId), {
        escalated: true,
        escalatedAt: serverTimestamp(),
        escalationNote: adminNote,
    });
}

export function subscribeToComplaints(callback) {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}

// ─── Notifications ─────────────────────────────────────────────────────────

export async function createNotification(userId, data) {
    const ref = collection(db, 'notifications', userId, 'items');
    await addDoc(ref, {
        ...data,
        read: false,
        timestamp: serverTimestamp(),
    });
}

export function subscribeToNotifications(userId, callback) {
    const q = query(
        collection(db, 'notifications', userId, 'items'),
        orderBy('timestamp', 'desc'),
        limit(20)
    );
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}

export async function markNotificationRead(userId, notifId) {
    await updateDoc(doc(db, 'notifications', userId, 'items', notifId), { read: true });
}

// ─── Audit Logs ────────────────────────────────────────────────────────────

export async function addAuditLog(action, userId, details) {
    await addDoc(collection(db, 'auditLogs'), {
        action,
        userId,
        details,
        timestamp: serverTimestamp(),
    });
}

export async function getAuditLogs(limitCount = 100) {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Live Stats ────────────────────────────────────────────────────────────

export async function getLiveStats() {
    const snap = await getDocs(collection(db, 'complaints'));
    const complaints = snap.docs.map(d => d.data());
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const resolvedThisWeek = complaints.filter(c => {
        if (!c.resolvedAt) return false;
        const resolvedDate = c.resolvedAt.toDate ? c.resolvedAt.toDate() : new Date(c.resolvedAt);
        return resolvedDate >= oneWeekAgo;
    }).length;

    const resolvedWithTime = complaints.filter(c => c.resolvedAt && c.createdAt);
    const avgResolutionHours = resolvedWithTime.length > 0
        ? Math.round(resolvedWithTime.reduce((acc, c) => {
            const created = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
            const resolved = c.resolvedAt.toDate ? c.resolvedAt.toDate() : new Date(c.resolvedAt);
            return acc + (resolved - created) / (1000 * 60 * 60);
        }, 0) / resolvedWithTime.length)
        : 0;

    return { total, resolved, resolvedThisWeek, avgResolutionHours, open: total - resolved };
}
