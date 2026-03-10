// Stores photos in browser memory (no server needed)
export const uploadEvidence = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve({
                url: reader.result,    // base64 image URL
                name: file.name,
                type: file.type,
                size: file.size
            });
        };
        reader.readAsDataURL(file);
    });
};