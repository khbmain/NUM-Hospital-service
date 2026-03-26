import mongoose from "mongoose";
import { ROLES } from "../utils/constants";

const UserSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    email: { type: String },
    password: { type: String },
    phone: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      default: "patient",
    },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    profilePic: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    birthdate: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    fcmToken: { type: String },
    phoneVerified: { type: Boolean, default: false },
    phoneOtp: { type: String },
    phoneOtpExpire: { type: Date },
    lastLoginAt: { type: Date },
  },
  { collection: "users", timestamps: true }
);

UserSchema.index({ role: 1 });

export const User = mongoose.model("User", UserSchema);
