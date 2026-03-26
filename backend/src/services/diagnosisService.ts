import { Diagnosis } from "../models/diagnosisModel";
import { Visit } from "../models/visitModel";
import { Patient } from "../models/patientModel";
import { Staff } from "../models/staffModel";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";
import { UserInputError } from "apollo-server-errors";
import { logAudit } from "./auditService";

const POPULATE_FIELDS = "visitId patientId doctorId createdBy";

// ─── Queries ───

export async function getDiagnosesByVisit(
  _: any,
  { visitId }: { visitId: string },
  ctx: ContextType
) {
  requireAuth(ctx);
  return Diagnosis.find({ visitId }).populate(POPULATE_FIELDS).sort({ createdAt: 1 });
}

export async function getDiagnosesByPatient(
  _: any,
  { patientId }: { patientId: string },
  ctx: ContextType
) {
  requireRole("doctor", "data_operator", "nurse", "superadmin")(ctx);
  return Diagnosis.find({ patientId }).populate(POPULATE_FIELDS).sort({ createdAt: -1 });
}

export async function getMyDiagnoses(
  _: any,
  { page = 1, limit = 20 }: { page?: number; limit?: number },
  ctx: ContextType
) {
  requireAuth(ctx);
  const patient = await Patient.findOne({ userId: ctx._id });
  if (!patient) throw new UserInputError("Өвчтөний бүртгэл олдсонгүй");

  return Diagnosis.find({ patientId: patient._id })
    .populate(POPULATE_FIELDS)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
}

// ─── Mutations ───

export async function createDiagnosis(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireRole("doctor")(ctx);

  const visit = await Visit.findById(input.visitId);
  if (!visit) throw new UserInputError("Үзлэг олдсонгүй");

  const doctorStaff = await Staff.findOne({ userId: ctx._id });

  const diagnosis = new Diagnosis({
    ...input,
    patientId: visit.patientId,
    doctorId: doctorStaff?._id,
    createdBy: ctx._id,
  });
  await diagnosis.save();

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "diagnosis",
    resourceId: diagnosis._id!.toString(),
    ctx,
  });

  return diagnosis.populate(POPULATE_FIELDS);
}

export async function updateDiagnosis(
  _: any,
  { _id, input }: { _id: string; input: any },
  ctx: ContextType
) {
  requireRole("doctor")(ctx);
  const diagnosis = await Diagnosis.findByIdAndUpdate(_id, input, { new: true })
    .populate(POPULATE_FIELDS);
  if (!diagnosis) throw new UserInputError("Онош олдсонгүй");
  return diagnosis;
}

export async function deleteDiagnosis(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("doctor")(ctx);
  const result = await Diagnosis.findByIdAndDelete(_id);
  if (!result) throw new UserInputError("Онош олдсонгүй");

  await logAudit({
    userId: ctx._id,
    action: "delete",
    resource: "diagnosis",
    resourceId: _id,
    ctx,
  });

  return true;
}
