import mongoose from "mongoose";
import { APPOINTMENT_STATUSES } from "../utils/constants";

const AppointmentSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
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
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    duration: { type: Number, default: 30 },
    type: {
      type: String,
      enum: ["walk_in", "scheduled", "follow_up", "emergency"],
      default: "scheduled",
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: "scheduled",
    },
    queueNumber: { type: Number },
    chiefComplaint: { type: String },
    notes: { type: String },
    checkedInAt: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "appointments", timestamps: true }
);

AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1, scheduledDate: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ scheduledDate: 1 });

export const Appointment = mongoose.model("Appointment", AppointmentSchema);
