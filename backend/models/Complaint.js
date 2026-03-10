import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },
  status: {
    type: String,
    enum: ["Submitted", "Assigned", "In Progress", "Resolved"],
    default: "Submitted"
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  evidencePaths: [String],             // local file paths on your PC
  aiScore: { type: Number },
  aiCategory: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

// Auto generate complaint ID before saving
complaintSchema.pre("save", async function(next) {
  if (!this.complaintId) {
    const count = await mongoose.model("Complaint").countDocuments();
    this.complaintId = `CF-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

export default mongoose.model("Complaint", complaintSchema);