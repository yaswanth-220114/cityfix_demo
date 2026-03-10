import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCitizenComplaints } from '../../utils/complaintStore';
import { StatusBadge, SeverityBadge, SkeletonCard, EmptyState } from '../../components/ui';

export default function MyComplaints() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!user) return;
        const data = getCitizenComplaints(user.uid);
        setComplaints(data);
        setLoading(false);
    }, [user]);

    const filtered = complaints.filter(c => {
        const matchSearch = !search ||
            c.title?.toLowerCase().includes(search.toLowerCase()) ||
            c.complaintId?.toLowerCase().includes(search.toLowerCase()) ||
            c.category?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || c.status === filter;
        return matchSearch && matchFilter;
    });

    const formatDate = (ts) => {
        if (!ts) return 'N/A';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const statusFilters = ['all', 'submitted', 'assigned', 'in-progress', 'resolved'];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        My Complaints
                    </h1>
                    <p className="text-slate-500">{complaints.length} total complaints submitted</p>
                </div>
                <button
                    onClick={() => navigate('/citizen/submit')}
                    className="btn-primary px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Complaint
                </button>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by title, ID, or category..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 input-field"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {statusFilters.map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filter === s
                                    ? 'bg-[#1a3c6e] text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Complaint List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Filter}
                    title={search || filter !== 'all' ? 'No complaints found' : 'No complaints yet'}
                    description={search || filter !== 'all'
                        ? 'Try adjusting your search or filter'
                        : 'Submit your first complaint to get started!'
                    }
                    action={
                        !search && filter === 'all' && (
                            <button onClick={() => navigate('/citizen/submit')} className="btn-primary px-6 py-3 rounded-xl text-sm">
                                Submit First Complaint
                            </button>
                        )
                    }
                />
            ) : (
                <div className="space-y-4">
                    {filtered.map(complaint => (
                        <div
                            key={complaint.id}
                            onClick={() => navigate(`/citizen/complaints/${complaint.id}`)}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 card-hover cursor-pointer group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap mb-2">
                                        <StatusBadge status={complaint.status} />
                                        <SeverityBadge severity={complaint.severity} />
                                        {complaint.escalated && (
                                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                                                Escalated
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-slate-800 text-base mb-1 truncate">{complaint.title}</h3>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-3">{complaint.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{complaint.complaintId || complaint.id}</span>
                                        </span>
                                        <span>{complaint.category}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(complaint.createdAt)}
                                        </span>
                                        {complaint.location?.address && (
                                            <span className="flex items-center gap-1 max-w-[200px] truncate">
                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                {complaint.location.address}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#1a3c6e] flex-shrink-0 transition-colors" />
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                    <span>Progress</span>
                                    <span>{complaint.status === 'resolved' ? '100%' : complaint.status === 'in-progress' ? '66%' : complaint.status === 'assigned' ? '33%' : '10%'}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: complaint.status === 'resolved' ? '100%' : complaint.status === 'in-progress' ? '66%' : complaint.status === 'assigned' ? '33%' : '10%',
                                            background: complaint.status === 'resolved' ? '#22c55e' : complaint.status === 'in-progress' ? '#f59e0b' : '#3b82f6',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
