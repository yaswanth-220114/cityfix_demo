import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, X, AlertTriangle, CheckCircle, Loader2, Camera, Navigation, FileText, Tag, MapPinned, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveComplaint, createNotification } from '../../utils/complaintStore';
import { scorePriority, analyzeImage } from '../../services/gemini';
import { sendComplaintConfirmation } from '../../services/emailjs';
import { LocationPickerMap } from '../../components/maps/MapComponents';
import toast from 'react-hot-toast';

const CATEGORIES = [
    'Roads & Infrastructure', 'Water Supply', 'Electricity',
    'Garbage & Sanitation', 'Street Lighting', 'Parks & Recreation',
    'Public Safety', 'Noise Pollution', 'Stray Animals', 'Other'
];

const SEVERITIES = [
    { value: 'low', label: 'Low', icon: '🟢', color: 'text-green-700 bg-green-50 border-green-300', desc: 'Minor inconvenience' },
    { value: 'medium', label: 'Medium', icon: '🟡', color: 'text-yellow-700 bg-yellow-50 border-yellow-300', desc: 'Needs attention' },
    { value: 'high', label: 'High', icon: '🟠', color: 'text-orange-700 bg-orange-50 border-orange-300', desc: 'Urgent issue' },
    { value: 'critical', label: 'Critical', icon: '🔴', color: 'text-red-700 bg-red-50 border-red-300', desc: 'Emergency' },
];

const STEPS = [
    { num: 1, label: 'Details', icon: FileText },
    { num: 2, label: 'Category', icon: Tag },
    { num: 3, label: 'Location', icon: MapPinned },
    { num: 4, label: 'Evidence', icon: Image },
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
    const [submitting, setSubmitting] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [duplicate, setDuplicate] = useState(null);
    const [aiScore, setAiScore] = useState(null);
    const [imageAnalysis, setImageAnalysis] = useState('');
    const fileInputRef = useRef(null);

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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
        <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    CityFix Complaint Portal
                </div>
                <h1 className="text-3xl font-bold text-sky-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Submit a Complaint
                </h1>
                <p className="text-sky-600">Report an issue in your area and help us keep the city running smoothly.</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-0 mb-8 bg-white rounded-2xl p-4 shadow-sm border border-sky-100">
                {STEPS.map((step, i) => (
                    <React.Fragment key={step.num}>
                        <div className="flex flex-col items-center flex-1">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-all ${i === 0 ? 'bg-[#0284c7] text-white shadow-md shadow-sky-200' : 'bg-sky-50 text-sky-400 border border-sky-200'}`}>
                                <step.icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] font-semibold ${i === 0 ? 'text-sky-700' : 'text-sky-400'}`}>{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className="flex-1 h-px bg-sky-100 mb-5 mx-1" />
                        )}
                    </React.Fragment>
                ))}
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

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── STEP 1: Complaint Details ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-500 to-sky-400 px-6 py-4 flex items-center gap-3">
                        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-bold text-white text-sm tracking-wide uppercase">1 · Complaint Details</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-sky-800 mb-2">
                                Title <span className="text-orange-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="E.g., Large pothole on 5th Avenue causing accidents"
                                value={form.title}
                                onChange={e => updateForm('title', e.target.value)}
                                required
                                className="input-field w-full px-4 py-3 rounded-xl text-sky-900 placeholder-sky-300 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-sky-800 mb-2">
                                Description <span className="text-orange-500">*</span>
                            </label>
                            <textarea
                                placeholder="Provide detailed information about the issue, its impact, and how long it has been present..."
                                value={form.description}
                                onChange={e => updateForm('description', e.target.value)}
                                required
                                rows={4}
                                className="input-field w-full px-4 py-3 rounded-xl text-sky-900 placeholder-sky-300 resize-none text-sm"
                            />
                            <p className="text-xs text-sky-400 mt-1.5">Be as specific as possible to help officers respond faster.</p>
                        </div>
                    </div>
                </div>

                {/* ── STEP 2: Category & Severity ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-4 flex items-center gap-3">
                        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                            <Tag className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-bold text-white text-sm tracking-wide uppercase">2 · Category & Severity</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-sky-800 mb-2">
                                    Category <span className="text-orange-500">*</span>
                                </label>
                                <select
                                    value={form.category}
                                    onChange={e => updateForm('category', e.target.value)}
                                    required
                                    className="input-field w-full px-4 py-3 rounded-xl text-sky-900 text-sm"
                                >
                                    <option value="">Select a category...</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-sky-800 mb-2">
                                    Severity <span className="text-orange-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SEVERITIES.map(s => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => updateForm('severity', s.value)}
                                            className={`px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all flex flex-col items-center gap-1 ${form.severity === s.value
                                                ? s.color + ' border-current shadow-sm'
                                                : 'bg-sky-50 text-sky-500 border-sky-100 hover:border-sky-200'
                                                }`}
                                        >
                                            <span className="text-base">{s.icon}</span>
                                            <div className="font-bold">{s.label}</div>
                                            <div className="text-[10px] font-normal opacity-70">{s.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── STEP 3: Location ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-700 to-sky-600 px-6 py-4 flex items-center gap-3">
                        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                            <MapPinned className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-bold text-white text-sm tracking-wide uppercase">3 · Location</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-3 mb-4">
                            <button
                                type="button"
                                onClick={handleGPS}
                                disabled={gpsLoading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0284c7] text-white text-sm font-semibold hover:bg-[#0369a1] transition-colors disabled:opacity-50 shadow-sm shadow-sky-200"
                            >
                                {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                {gpsLoading ? 'Detecting...' : 'Use My Location'}
                            </button>
                            <span className="text-sky-400 text-sm self-center italic">or click on the map below</span>
                        </div>

                        {form.address && (
                            <div className="flex items-center gap-2 mb-4 text-sm text-sky-700 bg-sky-50 px-4 py-2.5 rounded-xl border border-sky-200">
                                <MapPin className="w-4 h-4 flex-shrink-0 text-[#0284c7]" />
                                <span className="truncate font-medium">{form.address}</span>
                            </div>
                        )}

                        <LocationPickerMap
                            location={form.location}
                            onLocationSelect={(loc) => updateForm('location', loc)}
                            height="280px"
                        />
                        {!form.location && (
                            <p className="text-xs text-sky-400 mt-2 text-center">📍 Click anywhere on the map to pin the issue location</p>
                        )}
                    </div>
                </div>

                {/* ── STEP 4: Evidence ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-600 to-slate-500 px-6 py-4 flex items-center gap-3">
                        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                            <Image className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-bold text-white text-sm tracking-wide uppercase">4 · Evidence <span className="text-white/60 font-normal normal-case">(Optional)</span></h2>
                    </div>
                    <div className="p-6">
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-sky-200 rounded-2xl p-10 text-center hover:border-[#0284c7] hover:bg-sky-50/60 transition-all cursor-pointer group"
                        >
                            <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-sky-100 transition-colors">
                                <Camera className="w-7 h-7 text-sky-300 group-hover:text-[#0284c7] transition-colors" />
                            </div>
                            <p className="text-sm font-semibold text-sky-700">Drop photos/videos here</p>
                            <p className="text-xs text-sky-400 mt-1">or <span className="text-[#0284c7] underline underline-offset-2">click to browse</span> — JPG, PNG, MP4 up to 10MB</p>
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
                                            <img src={p.url} alt={p.name} className="w-full h-24 object-cover rounded-xl border border-sky-100" />
                                        ) : (
                                            <div className="w-full h-24 bg-sky-50 rounded-xl flex flex-col items-center justify-center border border-sky-100">
                                                <span className="text-2xl">🎥</span>
                                                <span className="text-[10px] text-sky-400 mt-1">Video</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {imageAnalysis && (
                            <div className="mt-4 bg-sky-50 rounded-xl p-4 border border-sky-200">
                                <p className="text-xs font-semibold text-sky-700 mb-1">🤖 AI Image Analysis:</p>
                                <p className="text-sky-800 text-sm">{imageAnalysis}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Submit Button ── */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5"
                    style={{ background: submitting ? '#cbd5e1' : 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting your complaint...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Submit Complaint
                        </>
                    )}
                </button>
                <p className="text-center text-xs text-sky-400 pb-4">Your complaint will be reviewed and assigned to the relevant department.</p>
            </form>
        </div>
    );
}
