import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        complaintId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Complaint",
        },
        complaintRef: { type: String, default: "" },  // human-readable ID e.g. CF-2026-00001
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ["status_update", "assignment", "resolution", "escalation", "submitted"],
            default: "status_update",
        },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
