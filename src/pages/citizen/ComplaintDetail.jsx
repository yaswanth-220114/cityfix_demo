import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, User, Image, AlertTriangle } from 'lucide-react';
import { getComplaintById } from '../../utils/complaintStore';
import { SinglePinMap } from '../../components/maps/MapComponents';
import { StatusBadge, SeverityBadge, LoadingSpinner } from '../../components/ui';

const TIMELINE_STEPS = [
    { status: 'submitted', label: 'Submitted', color: '#64748b' },
    { status: 'assigned', label: 'Assigned', color: '#3b82f6' },
    { status: 'in-progress', label: 'In Progress', color: '#f59e0b' },
    { status: 'resolved', label: 'Resolved', color: '#22c55e' },
];

export default function ComplaintDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const c = getComplaintById(id);
        setComplaint(c);
        setLoading(false);
    }, [id]);

    const formatDate = (ts) => {
        if (!ts) return 'N/A';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getStepIndex = (status) => {
        const idx = TIMELINE_STEPS.findIndex(s => s.status === status);
        return idx === -1 ? 0 : idx;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" color="primary" />
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-600 mb-2">Complaint not found</h2>
                <button onClick={() => navigate('/citizen/complaints')} className="btn-secondary px-6 py-3 rounded-xl text-sm mt-4">
                    Back to My Complaints
                </button>
            </div>
        );
    }

    const currentStepIdx = getStepIndex(complaint.status);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/citizen/complaints')}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                            {complaint.complaintId || complaint.id}
                        </span>
                        <StatusBadge status={complaint.status} />
                        <SeverityBadge severity={complaint.severity} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">{complaint.title}</h1>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Timeline */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="font-semibold text-slate-800 mb-6">Progress Timeline</h2>

                        {/* Step indicators */}
                        <div className="flex items-center mb-8">
                            {TIMELINE_STEPS.map((step, i) => (
                                <React.Fragment key={step.status}>
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${i <= currentStepIdx
                                            ? 'bg-[#1a3c6e] border-[#1a3c6e] text-white'
                                            : 'bg-white border-slate-200 text-slate-400'
                                            }`}>
                                            {i < currentStepIdx ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-xs mt-2 font-medium whitespace-nowrap ${i <= currentStepIdx ? 'text-[#1a3c6e]' : 'text-slate-400'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {i < TIMELINE_STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 transition-all ${i < currentStepIdx ? 'bg-[#1a3c6e]' : 'bg-slate-200'
                                            }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Timeline events */}
                        <div className="space-y-4">
                            {(complaint.timeline || []).map((event, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-[#1a3c6e] flex-shrink-0 mt-1"></div>
                                        {i < (complaint.timeline?.length || 0) - 1 && (
                                            <div className="w-0.5 flex-1 bg-slate-100 mt-1 min-h-[24px]"></div>
                                        )}
                                    </div>
                                    <div className="pb-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <StatusBadge status={event.status} />
                                            <span className="text-xs text-slate-400">{formatDate(event.time || event.timestamp)}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 mt-1">{event.message}</p>
                                        {event.proof && (
                                            <div className="mt-2">
                                                <img src={event.proof.url} alt="Resolution proof" className="h-32 rounded-xl object-cover border" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="font-semibold text-slate-800 mb-3">Description</h2>
                        <p className="text-slate-600 leading-relaxed">{complaint.description}</p>

                        {complaint.imageAnalysis && (
                            <div className="mt-4 bg-purple-50 rounded-xl p-4 border border-purple-100">
                                <p className="text-xs font-semibold text-purple-700 mb-1">🤖 AI Image Analysis</p>
                                <p className="text-purple-700 text-sm">{complaint.imageAnalysis}</p>
                            </div>
                        )}

                        {complaint.aiScore && (
                            <div className="mt-4 flex items-center gap-3">
                                <div className="text-2xl font-bold text-purple-700">{complaint.aiScore}/10</div>
                                <div>
                                    <p className="text-xs font-semibold text-purple-600">AI Priority Score</p>
                                    <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-1">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${complaint.aiScore * 10}%` }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Evidence Gallery */}
                    {complaint.evidence?.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Image className="w-4 h-4" /> Evidence Gallery
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {complaint.evidence.map((e, i) => (
                                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                                        {e.type === 'image' ? (
                                            <img src={e.url} alt={e.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center">
                                                <span className="text-3xl">🎥</span>
                                                <span className="text-xs text-slate-500 mt-1">Video</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Info card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h2 className="font-semibold text-slate-800 mb-4">Complaint Info</h2>
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs text-slate-400 block mb-0.5">Category</span>
                                <span className="text-sm font-medium text-slate-700">{complaint.category}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block mb-0.5">Submitted</span>
                                <span className="text-sm font-medium text-slate-700">{formatDate(complaint.createdAt)}</span>
                            </div>
                            {complaint.resolvedAt && (
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">Resolved</span>
                                    <span className="text-sm font-medium text-green-600">{formatDate(complaint.resolvedAt)}</span>
                                </div>
                            )}
                            {complaint.officerId && (
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">Assigned Officer</span>
                                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <User className="w-3 h-3" /> Officer Assigned
                                    </span>
                                </div>
                            )}
                            {complaint.escalated && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Escalated to Admin</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Map */}
                    {complaint.location?.lat && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location
                            </h2>
                            <SinglePinMap lat={complaint.location.lat} lng={complaint.location.lng} height="180px" />
                            {complaint.location.address && (
                                <p className="text-xs text-slate-500 mt-2 truncate">{complaint.location.address}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
