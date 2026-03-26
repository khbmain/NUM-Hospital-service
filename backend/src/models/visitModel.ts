import mongoose from "mongoose";
import { VISIT_STATUSES } from "../utils/constants";

const VisitSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    visitDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: VISIT_STATUSES,
      default: "draft",
    },
    chiefComplaint: { type: String },
    historyOfPresentIllness: { type: String },
    physicalExamination: { type: String },
    assessment: { type: String },
    plan: { type: String },
    notes: { type: String },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "visits", timestamps: true }
);

VisitSchema.index({ patientId: 1, visitDate: -1 });
VisitSchema.index({ doctorId: 1, visitDate: -1 });
VisitSchema.index({ appointmentId: 1 }, { unique: true, sparse: true });

export const Visit = mongoose.model("Visit", VisitSchema);
