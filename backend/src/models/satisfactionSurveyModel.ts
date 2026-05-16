import mongoose from "mongoose";

const SurveyRatingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    category: { type: String, required: true },
    score: { type: Number, min: 1, max: 5, required: true },
  },
  { _id: false }
);

const SatisfactionSurveySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "SatisfactionSurveyTemplate" },
    templateVersion: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    occupation: {
      type: String,
      enum: ["teacher", "student", "staff"],
      required: true,
    },
    studentHousing: {
      type: String,
      enum: ["dormitory", "home", "rental", ""],
      default: "",
    },
    hasVisited: { type: Boolean, required: true },
    visitFrequency: {
      type: String,
      enum: ["once", "multiple", "regular", ""],
      default: "",
    },
    servicesReceived: [{ type: String }],
    wouldReturn: { type: Boolean, required: true },
    wouldReturnReason: { type: String },
    improvementSuggestion: { type: String },
    ratings: [SurveyRatingSchema],
    overallRating: { type: Number, min: 1, max: 5 },
  },
  { collection: "satisfaction_surveys", timestamps: true }
);

SatisfactionSurveySchema.index({ userId: 1, createdAt: -1 });
SatisfactionSurveySchema.index({ patientId: 1, createdAt: -1 });

export const SatisfactionSurvey = mongoose.model(
  "SatisfactionSurvey",
  SatisfactionSurveySchema
);
