import mongoose from "mongoose";

const UnavailableBlockSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    reason: { type: String, required: true },
    note: { type: String },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledAppointmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "unavailable_blocks", timestamps: true }
);

UnavailableBlockSchema.index({ resourceId: 1, startAt: 1, endAt: 1 });
UnavailableBlockSchema.index({ staffId: 1, startAt: 1, endAt: 1 });

export const UnavailableBlock = mongoose.model("UnavailableBlock", UnavailableBlockSchema);
