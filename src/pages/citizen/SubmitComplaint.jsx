import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, X, Wand2, AlertTriangle, CheckCircle, Loader2, Camera, Navigation } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveComplaint, createNotification } from '../../utils/complaintStore';
import { categorizeComplaint, scorePriority, analyzeImage } from '../../services/gemini';
import { sendComplaintConfirmation } from '../../services/emailjs';
import { LocationPickerMap } from '../../components/maps/MapComponents';
import toast from 'react-hot-toast';

const CATEGORIES = [
    'Roads & Infrastructure', 'Water Supply', 'Electricity',
    'Garbage & Sanitation', 'Street Lighting', 'Parks & Recreation',
    'Public Safety', 'Noise Pollution', 'Stray Animals', 'Other'
];

const SEVERITIES = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50 border-green-200', desc: 'Minor inconvenience' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', desc: 'Needs attention' },
    { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-200', desc: 'Urgent issue' },
    { value: 'critical', label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200', desc: 'Emergency' },
];

export default function SubmitComplaint() {
    const { user, userData } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        severity: 'medium',
        location: null,
        address: '',
    });
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [duplicate, setDuplicate] = useState(null);
    const [aiScore, setAiScore] = useState(null);
    const [imageAnalysis, setImageAnalysis] = useState('');
    const fileInputRef = useRef(null);

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleAICategorize = async () => {
        if (!form.title && !form.description) {
            toast.error('Please add a title or description first');
            return;
        }
        setAiLoading(true);
        try {
            const [category, score] = await Promise.all([
                categorizeComplaint(form.title, form.description),
                scorePriority(form.title, form.description, form.category, form.severity),
            ]);
            setForm(prev => ({ ...prev, category }));
            setAiScore(score);
            toast.success('AI analysis complete!');
        } catch (err) {
            toast.error('AI analysis failed. Ensure Gemini API key is set.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleGPS = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setForm(prev => ({ ...prev, location: { lat, lng }, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));

                // Reverse geocode using Nominatim
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                    const data = await res.json();
                    const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    setForm(prev => ({ ...prev, address }));
                } catch { }

                setGpsLoading(false);
                toast.success('Location detected!');
            },
            (err) => {
                setGpsLoading(false);
                toast.error('Could not detect location: ' + err.message);
            }
        );
    };

    // File upload handling
    const handleFileChange = async (e) => {
        const selected = Array.from(e.target.files || []);
        if (!selected.length) return;

        const MAX_SIZE = 10 * 1024 * 1024;
        const valid = selected.filter(f => f.size <= MAX_SIZE);
        if (valid.length < selected.length) toast.error('Some files exceed 10MB limit');

        setFiles(prev => [...prev, ...valid]);

        // Create previews
        valid.forEach(f => {
            if (f.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPreviews(prev => [...prev, { url: e.target.result, name: f.name, type: 'image' }]);
                reader.readAsDataURL(f);

                // Auto-analyze first image with Gemini
                if (files.length === 0) {
                    reader.onload = async (e) => {
                        const base64 = e.target.result.split(',')[1];
                        setPreviews(prev => [...prev, { url: e.target.result, name: f.name, type: 'image' }]);
                        try {
                            const analysis = await analyzeImage(base64, f.type);
                            setImageAnalysis(analysis);
                            toast.success('Image analyzed by AI!');
                        } catch { }
                    };
                }
            } else {
                setPreviews(prev => [...prev, { url: null, name: f.name, type: 'video' }]);
            }
        });
    };

    const removeFile = (idx) => {
        setFiles(f => f.filter((_, i) => i !== idx));
        setPreviews(p => p.filter((_, i) => i !== idx));
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files);
        handleFileChange({ target: { files: dropped } });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.category) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (!form.location) {
            toast.error('Please select a location on the map or use GPS');
            return;
        }

        setSubmitting(true);
        try {
            // Store image previews as base64 (no Firebase Storage needed)
            const evidence = previews.map(p => ({ url: p.url || '', name: p.name, type: p.type }));

            const complaintData = {
                title: form.title,
                description: form.description,
                category: form.category,
                severity: form.severity,
                location: {
                    lat: form.location.lat,
                    lng: form.location.lng,
                    address: form.address,
                },
                citizenId: user.uid,
                citizenName: userData?.name || user?.name,
                citizenEmail: userData?.email || user?.email,
                evidence,
                aiScore: aiScore || 5,
                imageAnalysis,
            };

            // Save to localStorage (works without Firebase)
            const saved = saveComplaint(complaintData);
            const complaintId = saved.id;

            // Create in-app notification
            createNotification(user.uid, {
                message: `Your complaint "${form.title}" was submitted. ID: ${complaintId}`,
                complaintId,
                type: 'submitted',
            });

            // Best-effort email (silently fails if EmailJS not configured)
            sendComplaintConfirmation({
                to_email: userData?.email || user?.email || '',
                to_name: userData?.name || user?.name || 'Citizen',
                complaint_id: complaintId,
                title: form.title,
                category: form.category,
                severity: form.severity,
            }).catch(() => { });

            toast.success(`Complaint submitted! ID: ${complaintId}`, { duration: 5000 });
            navigate(`/citizen/complaints/${complaintId}`);
        } catch (err) {
            console.error(err);
            toast.error('Submission failed: ' + (err.message || 'Please try again'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Submit Complaint
                </h1>
                <p className="text-slate-500">Report an issue in your area. Our AI will help categorize and prioritize it.</p>
            </div>

            {duplicate && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800 text-sm">Possible Duplicate Detected</p>
                        <p className="text-amber-700 text-xs mt-0.5">
                            Similar complaint exists: <strong>{duplicate.complaintId}</strong> - {duplicate.title}.
                            You can still submit if this is a different issue.
                        </p>
                    </div>
                    <button onClick={() => setDuplicate(null)} className="text-amber-400 hover:text-amber-600 ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title & Description */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 bg-[#1a3c6e] rounded-full text-white text-xs flex items-center justify-center font-bold">1</span>
                        Complaint Details
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="E.g., Large pothole on 5th Avenue causing accidents"
                                value={form.title}
                                onChange={e => updateForm('title', e.target.value)}
                                required
                                className="input-field w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                placeholder="Provide detailed information about the issue, its impact, and how long it has been present..."
                                value={form.description}
                                onChange={e => updateForm('description', e.target.value)}
                                required
                                rows={4}
                                className="input-field w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 resize-none"
                            />
                        </div>

                        {/* AI Categorize Button */}
                        <button
                            type="button"
                            onClick={handleAICategorize}
                            disabled={aiLoading || (!form.title && !form.description)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50"
                        >
                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            {aiLoading ? 'Analyzing...' : 'Auto-Categorize with AI'}
                        </button>

                        {aiScore !== null && (
                            <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3 border border-purple-100">
                                <div className="text-2xl font-bold text-purple-700">{aiScore}/10</div>
                                <div>
                                    <p className="font-medium text-purple-800 text-sm">AI Priority Score</p>
                                    <p className="text-purple-600 text-xs">
                                        {aiScore >= 8 ? '🔴 Critical - Needs immediate attention' :
                                            aiScore >= 6 ? '🟠 High priority' :
                                                aiScore >= 4 ? '🟡 Medium priority' : '🟢 Low priority'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category & Severity */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 bg-[#1a3c6e] rounded-full text-white text-xs flex items-center justify-center font-bold">2</span>
                        Category & Severity
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.category}
                                onChange={e => updateForm('category', e.target.value)}
                                required
                                className="input-field w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-800"
                            >
                                <option value="">Select a category...</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Severity <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {SEVERITIES.map(s => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => updateForm('severity', s.value)}
                                        className={`px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${form.severity === s.value
                                            ? s.color + ' border-current'
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div>{s.label}</div>
                                        <div className="text-[10px] font-normal opacity-70">{s.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 bg-[#1a3c6e] rounded-full text-white text-xs flex items-center justify-center font-bold">3</span>
                        Location
                    </h2>

                    <div className="flex flex-wrap gap-3 mb-4">
                        <button
                            type="button"
                            onClick={handleGPS}
                            disabled={gpsLoading}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3c6e] text-white text-sm font-medium hover:bg-[#1e5a9e] transition-colors disabled:opacity-50"
                        >
                            {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                            {gpsLoading ? 'Detecting...' : 'Use My Location'}
                        </button>
                        <span className="text-slate-400 text-sm self-center">or click on the map below</span>
                    </div>

                    {form.address && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-[#1a3c6e] bg-blue-50 px-3 py-2 rounded-lg">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{form.address}</span>
                        </div>
                    )}

                    <LocationPickerMap
                        location={form.location}
                        onLocationSelect={(loc) => updateForm('location', loc)}
                        height="280px"
                    />
                    {!form.location && (
                        <p className="text-xs text-slate-400 mt-2 text-center">Click anywhere on the map to pin the location</p>
                    )}
                </div>

                {/* Evidence Upload */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 bg-[#1a3c6e] rounded-full text-white text-xs flex items-center justify-center font-bold">4</span>
                        Evidence (Optional)
                    </h2>

                    <div
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-[#1a3c6e] hover:bg-blue-50/30 transition-all cursor-pointer group"
                    >
                        <Camera className="w-10 h-10 text-slate-300 group-hover:text-[#1a3c6e] mx-auto mb-3 transition-colors" />
                        <p className="text-sm font-medium text-slate-600">Drop photos/videos or click to upload</p>
                        <p className="text-xs text-slate-400 mt-1">JPG, PNG, MP4 up to 10MB each</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {previews.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {previews.map((p, i) => (
                                <div key={i} className="relative group">
                                    {p.type === 'image' ? (
                                        <img src={p.url} alt={p.name} className="w-full h-24 object-cover rounded-xl" />
                                    ) : (
                                        <div className="w-full h-24 bg-slate-100 rounded-xl flex items-center justify-center">
                                            <span className="text-2xl">🎥</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {imageAnalysis && (
                        <div className="mt-4 bg-purple-50 rounded-xl p-4 border border-purple-100">
                            <p className="text-xs font-semibold text-purple-700 mb-1">🤖 AI Image Analysis:</p>
                            <p className="text-purple-800 text-sm">{imageAnalysis}</p>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Submit Complaint
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
