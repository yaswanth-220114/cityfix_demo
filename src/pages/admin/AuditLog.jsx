import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, Search } from 'lucide-react';
import { getComplaints } from '../../utils/complaintStore';

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Build audit log entries from complaint timelines stored in localStorage
        const complaints = getComplaints();
        const auditEntries = [];
        complaints.forEach(c => {
            (c.timeline || []).forEach(entry => {
                auditEntries.push({
                    id: `${c.id}-${entry.time}`,
                    action: entry.status,
                    details: `[${c.complaintId || c.id}] ${entry.message || entry.note || ''}`,
                    userId: entry.by || 'system',
                    timestamp: entry.time || entry.timestamp,
                });
            });
        });
        // Sort newest first
        auditEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(auditEntries);
        setLoading(false);
    }, []);

    const filtered = logs.filter(log => {
        const q = search.toLowerCase();
        return !search || log.action?.toLowerCase().includes(q) || log.details?.toLowerCase().includes(q);
    });

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getActionColor = (action) => {
        if (action?.includes('resolve')) return 'bg-green-100 text-green-700';
        if (action?.includes('assign')) return 'bg-blue-100 text-blue-700';
        if (action?.includes('submit')) return 'bg-purple-100 text-purple-700';
        if (action?.includes('escalat')) return 'bg-red-100 text-red-700';
        if (action?.includes('promote')) return 'bg-amber-100 text-amber-700';
        return 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Audit Log</h1>
                <p className="text-slate-500">Complete history of all system actions</p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search actions..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 input-field"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-3 border-[3px] border-[#1a3c6e] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400">No audit logs found</p>
                    <p className="text-slate-300 text-xs mt-1">Audit logs will appear here as users perform actions</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="divide-y divide-slate-50">
                        {filtered.map((log, i) => (
                            <div key={log.id || i} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatDate(log.timestamp)}
                                        </span>
                                    </div>
                                    {log.details && <p className="text-sm text-slate-600 truncate">{log.details}</p>}
                                    {log.userId && (
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                            <User className="w-3 h-3" /> {log.userId.slice(0, 12)}...
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
