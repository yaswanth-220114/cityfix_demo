import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Image, MessageSquare, CheckCircle, AlertTriangle, Upload, Loader2, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getComplaintById, updateComplaintStatus, escalateComplaint, createNotification } from '../../utils/complaintStore';
import { SinglePinMap } from '../../components/maps/MapComponents';
import { StatusBadge, SeverityBadge, LoadingSpinner, Modal } from '../../components/ui';
import { sendStatusUpdate } from '../../services/emailjs';
import toast from 'react-hot-toast';
import { useRef } from 'react';

export default function OfficerComplaintDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noteModal, setNoteModal] = useState(false);
    const [resolveModal, setResolveModal] = useState(false);
    const [note, setNote] = useState('');
    const [resolveNote, setResolveNote] = useState('');
    const [updating, setUpdating] = useState(false);
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const proofRef = useRef(null);

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

    const handleAddNote = async () => {
        if (!note.trim()) return;
        setUpdating(true);
        try {
            updateComplaintStatus(id, complaint.status, note, user.uid);
            createNotification(complaint.citizenId, {
                message: `Officer added a note on your complaint "${complaint.title}": ${note.slice(0, 60)}...`,
                complaintId: id,
                type: 'note',
            });
            toast.success('Field note added!');
            setNote('');
            setNoteModal(false);
            setComplaint(getComplaintById(id));
        } catch (err) {
            toast.error('Failed to add note');
        } finally {
            setUpdating(false);
        }
    };

    const handleMarkInProgress = async () => {
        setUpdating(true);
        try {
            updateComplaintStatus(id, 'in-progress', 'Work has started on this complaint.', user.uid);
            createNotification(complaint.citizenId, {
                message: `Your complaint "${complaint.title}" is now In Progress!`,
                complaintId: id,
                type: 'status_update',
            });
            toast.success('Status updated to In Progress');
            setComplaint(getComplaintById(id));
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleResolve = async () => {
        if (!resolveNote.trim()) {
            toast.error('Please add a resolution note');
            return;
        }
        setUpdating(true);
        try {
            const proofData = proofPreview ? { url: proofPreview, name: proofFile?.name } : null;
            updateComplaintStatus(id, 'resolved', resolveNote, user.uid, proofData);

            createNotification(complaint.citizenId, {
                message: `Great news! Your complaint "${complaint.title}" has been resolved! ✅`,
                complaintId: id,
                type: 'resolved',
            });

            sendStatusUpdate({
                to_email: complaint.citizenEmail || '',
                to_name: complaint.citizenName || 'Citizen',
                complaint_id: complaint.complaintId || id,
                title: complaint.title,
                new_status: 'Resolved',
                note: resolveNote,
            }).catch(() => { });

            toast.success('Complaint marked as Resolved!');
            setResolveModal(false);
            setComplaint(getComplaintById(id));
        } catch {
            toast.error('Failed to resolve complaint');
        } finally {
            setUpdating(false);
        }
    };

    const handleEscalate = async () => {
        if (!window.confirm('Escalate this complaint to Admin?')) return;
        try {
            escalateComplaint(id, 'Escalated by officer - needs admin attention');
            toast.success('Complaint escalated to Admin');
            setComplaint(getComplaintById(id));
        } catch {
            toast.error('Failed to escalate');
        }
    };

    const handleProofUpload = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setProofFile(f);
        const reader = new FileReader();
        reader.onload = e => setProofPreview(e.target.result);
        reader.readAsDataURL(f);
    };

    if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (!complaint) return <div className="text-center py-20 text-slate-500">Complaint not found</div>;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div className="flex items-start gap-4">
                    <button onClick={() => navigate('/officer')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{complaint.complaintId || complaint.id}</span>
                            <StatusBadge status={complaint.status} />
                            <SeverityBadge severity={complaint.severity} />
                            {complaint.escalated && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">⚠️ Escalated</span>}
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">{complaint.title}</h1>
                    </div>
                </div>

                {/* Action buttons */}
                {complaint.status !== 'resolved' && (
                    <div className="flex gap-2 flex-wrap">
                        {complaint.status !== 'in-progress' && (
                            <button
                                onClick={handleMarkInProgress}
                                disabled={updating}
                                className="px-3 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                            >
                                Mark In Progress
                            </button>
                        )}
                        <button
                            onClick={() => setNoteModal(true)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Add Note
                        </button>
                        <button
                            onClick={() => setResolveModal(true)}
                            className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            Mark Resolved
                        </button>
                        {!complaint.escalated && complaint.severity === 'critical' && (
                            <button
                                onClick={handleEscalate}
                                className="px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Escalate
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
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
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="font-semibold text-slate-800 mb-4">Status Timeline</h2>
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
                                        {event.proof?.url && (
                                            <img src={event.proof.url} alt="Resolution proof" className="mt-2 h-32 rounded-xl object-cover border" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Evidence */}
                    {complaint.evidence?.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Image className="w-4 h-4" /> Evidence Gallery
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {complaint.evidence.map((e, i) => (
                                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                                        {e.type === 'image' ? (
                                            <img src={e.url} alt={e.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">🎥</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h2 className="font-semibold text-slate-800 mb-4">Complaint Info</h2>
                        <div className="space-y-3 text-sm">
                            <div><span className="text-xs text-slate-400 block">Category</span><span className="font-medium">{complaint.category}</span></div>
                            <div><span className="text-xs text-slate-400 block">Submitted By</span><span className="font-medium flex items-center gap-1"><User className="w-3 h-3" /> {complaint.citizenName || 'Citizen'}</span></div>
                            <div><span className="text-xs text-slate-400 block">Submitted</span><span className="font-medium">{formatDate(complaint.createdAt)}</span></div>
                            {complaint.aiScore && (
                                <div><span className="text-xs text-slate-400 block">AI Priority Score</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-purple-700">{complaint.aiScore}/10</span>
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${complaint.aiScore * 10}%` }} /></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {complaint.location?.lat && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location
                            </h2>
                            <SinglePinMap lat={complaint.location.lat} lng={complaint.location.lng} height="180px" />
                            {complaint.location.address && <p className="text-xs text-slate-500 mt-2 break-words">{complaint.location.address}</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Note Modal */}
            <Modal isOpen={noteModal} onClose={() => setNoteModal(false)} title="Add Field Note">
                <div className="space-y-4">
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Describe your field observations, actions taken, or updates..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm input-field resize-none"
                    />
                    <button
                        onClick={handleAddNote}
                        disabled={updating || !note.trim()}
                        className="btn-secondary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        {updating ? 'Saving...' : 'Add Note'}
                    </button>
                </div>
            </Modal>

            {/* Resolve Modal */}
            <Modal isOpen={resolveModal} onClose={() => setResolveModal(false)} title="Mark as Resolved">
                <div className="space-y-4">
                    <textarea
                        value={resolveNote}
                        onChange={e => setResolveNote(e.target.value)}
                        placeholder="Describe how the issue was resolved..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm input-field resize-none"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Resolution Proof (Optional)</label>
                        <div onClick={() => proofRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all">
                            {proofPreview ? (
                                <img src={proofPreview} alt="proof" className="h-32 mx-auto rounded-lg object-cover" />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">Upload a photo as proof of resolution</p>
                                </>
                            )}
                            <input ref={proofRef} type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />
                        </div>
                    </div>

                    <button
                        onClick={handleResolve}
                        disabled={updating || !resolveNote.trim()}
                        className="w-full py-3 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {updating ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
