import mongoose from "mongoose";

const WorkScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: { type: String },
    endTime: { type: String },
  },
  { _id: false }
);

const ResourceSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["doctor", "nurse", "device", "room", "capacity_room"],
      required: true,
    },
    category: { type: String },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    room: { type: String },
    capacity: { type: Number, default: 1 },
    slotIntervalMinutes: { type: Number, default: 30 },
    defaultDurationMinutes: { type: Number },
    defaultBufferMinutes: { type: Number },
    workSchedule: [WorkScheduleSchema],
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { collection: "resources", timestamps: true }
);

ResourceSchema.index({ type: 1 });
ResourceSchema.index({ serviceIds: 1 });
ResourceSchema.index({ isActive: 1 });

export const Resource = mongoose.model("Resource", ResourceSchema);
