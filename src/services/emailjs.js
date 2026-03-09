import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id';
const COMPLAINT_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id';
const STATUS_TEMPLATE = import.meta.env.VITE_EMAILJS_STATUS_TEMPLATE_ID || 'your_status_template_id';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

export function initEmailJS() {
    emailjs.init(PUBLIC_KEY);
}

export async function sendComplaintConfirmation({ to_email, to_name, complaint_id, title, category, severity }) {
    try {
        await emailjs.send(SERVICE_ID, COMPLAINT_TEMPLATE, {
            to_email,
            to_name,
            complaint_id,
            title,
            category,
            severity,
            submitted_at: new Date().toLocaleString(),
        });
    } catch (err) {
        console.warn('Email send failed:', err);
    }
}

export async function sendStatusUpdate({ to_email, to_name, complaint_id, title, new_status, note }) {
    try {
        await emailjs.send(SERVICE_ID, STATUS_TEMPLATE, {
            to_email,
            to_name,
            complaint_id,
            title,
            new_status,
            note: note || 'No additional note',
            updated_at: new Date().toLocaleString(),
        });
    } catch (err) {
        console.warn('Email send failed:', err);
    }
}
