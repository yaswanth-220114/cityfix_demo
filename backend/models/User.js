import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, minlength: 6, select: false }, // optional — Google login has no password
        googleId: { type: String, default: "" },
        role: { type: String, enum: ["citizen", "officer", "admin"], default: "citizen" },
        zone: { type: String, default: "" },
        department: { type: String, default: "" },
        phone: { type: String, default: "" },
        photoURL: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Hash password before saving (skip for Google-only users)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (plain) {
    if (!this.password) return false;
    return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);