import mongoose from "mongoose";

const PrescriptionItemSchema = new mongoose.Schema(
  {
    medicationName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    instructions: { type: String },
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
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
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    prescriptionNumber: { type: String, required: true, unique: true },
    items: [PrescriptionItemSchema],
    notes: { type: String },
    status: {
      type: String,
      enum: ["active", "dispensed", "cancelled"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "prescriptions", timestamps: true }
);

PrescriptionSchema.index({ visitId: 1 });
PrescriptionSchema.index({ patientId: 1, createdAt: -1 });

export const Prescription = mongoose.model("Prescription", PrescriptionSchema);
