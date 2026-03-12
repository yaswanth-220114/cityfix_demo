import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, AlertTriangle, ChevronRight } from 'lucide-react';
import { getComplaints, getAllOfficers, assignComplaint, createNotification } from '../../utils/complaintStore';
import { StatusBadge, SeverityBadge, SkeletonCard, Modal } from '../../components/ui';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'submitted', 'assigned', 'in-progress', 'resolved', 'escalated'];

export default function ComplaintOversight() {
    const [complaints, setComplaints] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [assignModal, setAssignModal] = useState(null);
    const [selectedOfficer, setSelectedOfficer] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        setComplaints(getComplaints());
        setOfficers(getAllOfficers());
        setLoading(false);
    }, []);

    const filtered = complaints.filter(c => {
        const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.complaintId?.toLowerCase().includes(search.toLowerCase()) || c.citizenName?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const handleAssign = async () => {
        if (!selectedOfficer || !assignModal) return;
        setAssigning(true);
        try {
            const officer = officers.find(o => o.id === selectedOfficer || o.uid === selectedOfficer);
            assignComplaint(assignModal.id || assignModal.complaintId, selectedOfficer, officer?.name || '');

            // Notify officer
            createNotification(selectedOfficer, {
                message: `New complaint assigned to you: "${assignModal.title}"`,
                complaintId: assignModal.id,
                type: 'assigned',
            });

            // Notify citizen
            if (assignModal.citizenId) {
                createNotification(assignModal.citizenId, {
                    message: `Your complaint "${assignModal.title}" has been assigned to an officer`,
                    complaintId: assignModal.id,
                    type: 'status_update',
                });
            }

            toast.success('Complaint assigned successfully!');
            setAssignModal(null);
            setSelectedOfficer('');
            setComplaints(getComplaints());
        } catch {
            toast.error('Failed to assign complaint');
        } finally {
            setAssigning(false);
        }
    };

    const exportCSV = () => {
        const headers = ['ID', 'Title', 'Category', 'Severity', 'Status', 'Citizen', 'Created', 'Resolved'];
        const rows = filtered.map(c => [
            c.complaintId || c.id,
            `"${c.title}"`,
            c.category,
            c.severity,
            c.status,
            c.citizenName || '',
            c.createdAt?.toDate ? c.createdAt.toDate().toISOString().slice(0, 10) : '',
            c.resolvedAt?.toDate ? c.resolvedAt.toDate().toISOString().slice(0, 10) : '',
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cityfix-complaints-${Date.now()}.csv`;
        a.click();
        toast.success('CSV exported!');
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // SLA check
    const isOverSLA = (c) => {
        if (c.status === 'resolved') return false;
        const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
        return (Date.now() - created.getTime()) / 3600000 > 48;
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Complaint Oversight</h1>
                    <p className="text-slate-500">{complaints.length} total complaints</p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3c6e] text-white rounded-xl text-sm font-medium hover:bg-[#1e5a9e] transition-colors">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search by title, ID, or citizen..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 input-field" />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-[#1a3c6e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(c => (
                                    <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${isOverSLA(c) ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {isOverSLA(c) && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                                                <span className="font-mono text-xs text-slate-500">{c.complaintId || c.id.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-slate-800 truncate max-w-[180px]">{c.title}</p>
                                                <p className="text-xs text-slate-400">{c.citizenName || 'Unknown'}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <div className="flex items-center flex-col items-start gap-1">
                                                <span className="text-xs text-slate-600">{c.category}</span>
                                                <SeverityBadge severity={c.severity} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">{formatDate(c.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => { setAssignModal(c); setSelectedOfficer(c.officerId || ''); }}
                                                className="px-3 py-1.5 bg-[#1a3c6e]/10 text-[#1a3c6e] rounded-lg text-xs font-medium hover:bg-[#1a3c6e]/20 transition-colors"
                                            >
                                                {c.officerId ? 'Reassign' : 'Assign'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Complaint`}>
                <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="font-medium text-slate-800">{assignModal?.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{assignModal?.category} · {assignModal?.severity}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Officer</label>
                        <select value={selectedOfficer} onChange={e => setSelectedOfficer(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm input-field">
                            <option value="">-- Select an officer --</option>
                            {officers.map(o => <option key={o.id} value={o.id}>{o.name} {o.zone ? `· ${o.zone}` : ''}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAssign} disabled={!selectedOfficer || assigning} className="btn-secondary w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
                        {assigning ? 'Assigning...' : 'Assign Complaint'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
