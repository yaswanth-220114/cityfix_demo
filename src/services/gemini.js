// Gemini AI Service
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(parts) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
        throw new Error('Gemini API key not configured');
    }
    const res = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
    });
    const data = await res.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid Gemini response');
    }
    return data.candidates[0].content.parts[0].text.trim();
}

export async function categorizeComplaint(title, description) {
    const categories = ['Roads & Infrastructure', 'Water Supply', 'Electricity', 'Garbage & Sanitation', 'Street Lighting', 'Parks & Recreation', 'Public Safety', 'Noise Pollution', 'Stray Animals', 'Other'];
    try {
        const text = await callGemini([{
            text: `You are a civic complaint categorizer. Based on the following complaint title and description, select the SINGLE most appropriate category from this list: ${categories.join(', ')}.
      
Title: ${title}
Description: ${description}

Reply with ONLY the category name, nothing else.`
        }]);
        const matched = categories.find(c => text.toLowerCase().includes(c.toLowerCase()));
        return matched || 'Other';
    } catch {
        return 'Other';
    }
}

export async function scorePriority(title, description, category, severity) {
    try {
        const text = await callGemini([{
            text: `You are a civic complaint priority scorer. Rate the urgency of this complaint from 1-10 (10 being most urgent).

Title: ${title}
Description: ${description}
Category: ${category}
Severity: ${severity}

Consider public safety, number of people affected, and urgency. Reply with ONLY a number from 1-10.`
        }]);
        const score = parseInt(text.match(/\d+/)?.[0] || '5');
        return Math.min(10, Math.max(1, score));
    } catch {
        return 5;
    }
}

export async function analyzeImage(base64Image, mimeType = 'image/jpeg') {
    try {
        const text = await callGemini([
            { text: 'Analyze this civic complaint image briefly. Describe the problem visible in 2-3 sentences. Be specific and concise.' },
            { inline_data: { mime_type: mimeType, data: base64Image } }
        ]);
        return text;
    } catch {
        return 'Image analysis not available. Please ensure Gemini API key is configured.';
    }
}

export async function checkDuplicates(title, description, existingComplaints) {
    if (!existingComplaints?.length) return null;
    try {
        const recentComplaints = existingComplaints.slice(0, 10).map(c =>
            `ID: ${c.complaintId || c.id}, Title: ${c.title}, Category: ${c.category}`
        ).join('\n');

        const text = await callGemini([{
            text: `Check if the new complaint is a duplicate of any existing complaints.

New Complaint:
Title: ${title}
Description: ${description}

Existing Complaints:
${recentComplaints}

Reply with ONLY the complaint ID if it's a duplicate, or "no_duplicate" if it's not.`
        }]);

        if (text.toLowerCase().includes('no_duplicate')) return null;
        const match = existingComplaints.find(c =>
            text.includes(c.complaintId || c.id)
        );
        return match || null;
    } catch {
        return null;
    }
}

export async function chatbotResponse(message, context = '') {
    try {
        const text = await callGemini([{
            text: `You are CityBot, a helpful assistant for the CityFix civic complaint platform. Help citizens submit complaints and track their issues.

Context: ${context}
User: ${message}

Keep your response friendly, concise (2-3 sentences), and helpful. Guide users on how to submit complaints, track status, or use the platform.`
        }]);
        return text;
    } catch {
        return "I'm here to help! You can submit a complaint using the 'Submit Complaint' button. Fill in the title, description, and location, then our AI will help categorize it automatically.";
    }
}
