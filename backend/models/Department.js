import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        zone: { type: String, default: "" },
        headOfficerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        categories: [String],   // complaint categories handled by this dept
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
