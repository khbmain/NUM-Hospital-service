import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    headStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    isActive: { type: Boolean, default: true },
  },
  { collection: "departments", timestamps: true }
);

export const Department = mongoose.model("Department", DepartmentSchema);
