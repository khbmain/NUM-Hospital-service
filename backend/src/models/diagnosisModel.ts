import mongoose from "mongoose";
import { DIAGNOSIS_TYPES, SEVERITY_LEVELS } from "../utils/constants";

const DiagnosisSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    visitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    icdCode: { type: String },
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: DIAGNOSIS_TYPES,
      default: "primary",
    },
    severity: {
      type: String,
      enum: SEVERITY_LEVELS,
    },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "diagnoses", timestamps: true }
);

DiagnosisSchema.index({ visitId: 1 });
DiagnosisSchema.index({ patientId: 1 });

export const Diagnosis = mongoose.model("Diagnosis", DiagnosisSchema);
