import mongoose from "mongoose";

const ExternalIdentitySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["num_sisi", "google", "custom_oidc"],
      required: true,
    },
    providerUserId: { type: String, required: true },
    providerEmail: { type: String },
    providerData: { type: Object },
    linkedAt: { type: Date, default: Date.now },
  },
  { collection: "external_identities", timestamps: true }
);

ExternalIdentitySchema.index(
  { provider: 1, providerUserId: 1 },
  { unique: true }
);
ExternalIdentitySchema.index({ userId: 1 });

export const ExternalIdentity = mongoose.model(
  "ExternalIdentity",
  ExternalIdentitySchema
);
