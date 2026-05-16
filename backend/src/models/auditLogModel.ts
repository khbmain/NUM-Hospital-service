import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: {
      type: String,
      enum: ["create", "update", "upsert", "delete", "login", "logout", "access", "export"],
      required: true,
    },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Object },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { collection: "audit_logs", timestamps: true }
);

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ createdAt: -1 });
// TTL: auto-delete after 1 year
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
