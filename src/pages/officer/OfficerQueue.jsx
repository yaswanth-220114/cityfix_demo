import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOfficerComplaints, getComplaints } from '../../utils/complaintStore';
import { StatusBadge, SeverityBadge, SkeletonCard, EmptyState } from '../../components/ui';

const CATEGORIES = ['All Categories', 'Roads & Infrastructure', 'Water Supply', 'Electricity', 'Garbage & Sanitation', 'Street Lighting', 'Parks & Recreation', 'Public Safety', 'Other'];
const SEVERITIES_FILTER = ['All Severities', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['All', 'submitted', 'assigned', 'in-progress', 'resolved'];

export default function OfficerQueue() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All Categories');
    const [sevFilter, setSevFilter] = useState('All Severities');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        if (!user) return;
        // Show complaints assigned to this officer; fall back to all if none assigned yet
        const assigned = getOfficerComplaints(user.uid);
        const data = assigned.length > 0 ? assigned : getComplaints();
        setComplaints(data);
        setLoading(false);
    }, [user]);

    const filtered = complaints.filter(c => {
        const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.complaintId?.toLowerCase().includes(search.toLowerCase());
        const matchCat = catFilter === 'All Categories' || c.category === catFilter;
        const matchSev = sevFilter === 'All Severities' || c.severity === sevFilter;
        const matchStatus = statusFilter === 'All' || c.status === statusFilter;
        return matchSearch && matchCat && matchSev && matchStatus;
    });

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getHoursAgo = (ts) => {
        if (!ts) return null;
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return Math.floor((Date.now() - d.getTime()) / 3600000);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Complaint Queue
                </h1>
                <p className="text-slate-500">{complaints.length} complaints assigned to you</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative sm:col-span-2 lg:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search complaints..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 input-field"
                        />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 input-field">
                        {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
                    </select>
                    <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 input-field">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 input-field">
                        {SEVERITIES_FILTER.map(s => <option key={s} value={s}>{s === 'All Severities' ? 'All Severity' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total', value: complaints.length, color: 'bg-blue-50 text-blue-700' },
                    { label: 'Pending', value: complaints.filter(c => c.status === 'submitted').length, color: 'bg-slate-100 text-slate-700' },
                    { label: 'In Progress', value: complaints.filter(c => c.status === 'in-progress').length, color: 'bg-amber-50 text-amber-700' },
                    { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, color: 'bg-green-50 text-green-700' },
                ].map(s => (
                    <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                        <div className="text-xl font-bold">{s.value}</div>
                        <div className="text-xs font-medium opacity-70">{s.label}</div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Filter} title="No complaints found" description="Adjust your filters or wait for new assignments" />
            ) : (
                <div className="space-y-4">
                    {filtered.map(c => {
                        const hoursAgo = getHoursAgo(c.createdAt);
                        const isOverdue = hoursAgo && hoursAgo > 72 && c.status !== 'resolved';
                        return (
                            <div
                                key={c.id}
                                onClick={() => navigate(`/officer/complaint/${c.id}`)}
                                className={`bg-white rounded-2xl p-5 shadow-sm border cursor-pointer group card-hover ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-2 mb-2">
                                            <StatusBadge status={c.status} />
                                            <SeverityBadge severity={c.severity} />
                                            {isOverdue && (
                                                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                                    <AlertTriangle className="w-3 h-3" /> {hoursAgo}h overdue
                                                </span>
                                            )}
                                            {c.escalated && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">Escalated</span>}
                                        </div>
                                        <h3 className="font-semibold text-slate-800 mb-1 truncate">{c.title}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-1 mb-2">{c.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{c.complaintId || c.id}</span>
                                            <span>{c.category}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {formatDate(c.createdAt)}
                                                {hoursAgo && <span className="text-slate-300">({hoursAgo}h ago)</span>}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                AI Score: <strong className="text-purple-600">{c.aiScore || 'N/A'}/10</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#1a3c6e] flex-shrink-0 transition-colors" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
