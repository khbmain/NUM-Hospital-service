import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ["consultation", "injection", "infusion", "procedure", "device", "lab", "other"],
      default: "other",
    },
    description: { type: String },
    defaultDurationMinutes: { type: Number, default: 30 },
    defaultBufferMinutes: { type: Number, default: 0 },
    requiresDoctor: { type: Boolean, default: false },
    requiresNurse: { type: Boolean, default: false },
    requiresDevice: { type: Boolean, default: false },
    assignedStaffIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Staff" }],
    isActive: { type: Boolean, default: true },
  },
  { collection: "services", timestamps: true }
);

ServiceSchema.index({ category: 1 });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ assignedStaffIds: 1 });

export const Service = mongoose.model("Service", ServiceSchema);
