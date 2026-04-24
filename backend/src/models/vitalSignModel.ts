import mongoose from "mongoose";

const VitalSignSchema = new mongoose.Schema(
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
    temperature: { type: Number },
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    heartRate: { type: Number },
    respiratoryRate: { type: Number },
    oxygenSaturation: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    painScore: { type: Number, min: 0, max: 10 },
    bloodGlucose: { type: Number },
    bmi: { type: Number },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "vital_signs", timestamps: true }
);

VitalSignSchema.index({ visitId: 1 });

export const VitalSign = mongoose.model("VitalSign", VitalSignSchema);
