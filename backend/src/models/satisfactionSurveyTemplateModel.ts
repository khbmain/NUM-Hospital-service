import mongoose from "mongoose";

const SurveyTemplateQuestionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const SurveyTemplateVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    questions: [SurveyTemplateQuestionSchema],
    validFrom: { type: Date, required: true },
    validTo: { type: Date },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const SatisfactionSurveyTemplateSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String },
    active: { type: Boolean, default: true },
    currentVersion: { type: Number, default: 1 },
    questions: [SurveyTemplateQuestionSchema],
    versions: [SurveyTemplateVersionSchema],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { collection: "satisfaction_survey_templates", timestamps: true }
);

SatisfactionSurveyTemplateSchema.index({ active: 1, updatedAt: -1 });

export const SatisfactionSurveyTemplate = mongoose.model(
  "SatisfactionSurveyTemplate",
  SatisfactionSurveyTemplateSchema
);
