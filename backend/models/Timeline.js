import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
    {
        complaintId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Complaint",
            required: true,
        },
        status: { type: String, required: true },
        note: { type: String, default: "" },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        proofUrl: { type: String, default: "" },   // optional resolution photo
    },
    { timestamps: true }   // createdAt = the timestamp shown in the UI
);

export default mongoose.model("Timeline", timelineSchema);
