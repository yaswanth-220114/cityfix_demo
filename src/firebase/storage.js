import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export async function uploadFile(file, path) {
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, `${path}/${filename}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { url, filename, type: file.type };
}

export async function uploadEvidence(complaintId, files) {
    const uploads = await Promise.all(
        files.map(f => uploadFile(f, `complaints/${complaintId}/evidence`))
    );
    return uploads;
}

export async function uploadResolutionProof(complaintId, file) {
    return uploadFile(file, `complaints/${complaintId}/resolution`);
}
