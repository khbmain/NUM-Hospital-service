import mongoose from "mongoose";
import { PATIENT_CATEGORIES, BLOOD_TYPES } from "../utils/constants";

const PatientSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    registrationNumber: { type: String, required: true, unique: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    birthdate: { type: Date },
    nationalId: { type: String },
    sisiId: { type: String },
    category: {
      type: String,
      enum: PATIENT_CATEGORIES,
      default: "external",
    },
    universityId: { type: String },
    bloodType: { type: String, enum: BLOOD_TYPES, default: "unknown" },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    regularMedications: [{ type: String }],
    medicalWarnings: [{ type: String }],
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    address: { type: String },
    notes: { type: String },
    profileCompletedAt: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "patients", timestamps: true }
);

PatientSchema.index({ phone: 1 });
PatientSchema.index({ sisiId: 1 }, { sparse: true });
PatientSchema.index({ nationalId: 1 }, { sparse: true });
PatientSchema.index({ lastname: 1, firstname: 1 });
PatientSchema.index(
  { firstname: "text", lastname: "text", phone: "text", registrationNumber: "text" },
  { name: "patient_text_search" }
);

export const Patient = mongoose.model("Patient", PatientSchema);
