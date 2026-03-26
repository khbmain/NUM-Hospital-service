import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    staffType: {
      type: String,
      enum: ["doctor", "nurse", "data_operator", "admin_staff"],
      required: true,
    },
    specialization: { type: String },
    licenseNumber: { type: String },
    title: { type: String },
    bio: { type: String },
    isAvailable: { type: Boolean, default: true },
    workSchedule: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 },
        startTime: { type: String },
        endTime: { type: String },
      },
    ],
    maxDailyAppointments: { type: Number, default: 20 },
    status: {
      type: String,
      enum: ["active", "on_leave", "inactive"],
      default: "active",
    },
  },
  { collection: "staff", timestamps: true }
);

StaffSchema.index({ departmentId: 1 });
StaffSchema.index({ staffType: 1 });

export const Staff = mongoose.model("Staff", StaffSchema);
