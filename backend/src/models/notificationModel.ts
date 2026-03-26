import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String },
    body: { type: Object },
    type: {
      type: String,
      enum: ["info", "warning", "success", "request", "appointment", "treatment"],
      default: "info",
    },
    read: { type: Boolean, default: false },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 90, // TTL: 90 days
    },
  },
  { collection: "notifications", timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model("Notification", NotificationSchema);
