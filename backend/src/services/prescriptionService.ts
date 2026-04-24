import { Prescription } from "../models/prescriptionModel";
import { Visit } from "../models/visitModel";
import { Patient } from "../models/patientModel";
import { Staff } from "../models/staffModel";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";
import { UserInputError } from "apollo-server-errors";
import { generateOrderNumber } from "../utils/helper";
import { logAudit } from "./auditService";

const POPULATE_FIELDS = "visitId patientId doctorId createdBy";

// ─── Queries ───

export async function getPrescription(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireAuth(ctx);
  return Prescription.findById(_id).populate(POPULATE_FIELDS);
}

export async function getPrescriptionsByVisit(
  _: any,
  { visitId }: { visitId: string },
  ctx: ContextType
) {
  requireAuth(ctx);
  return Prescription.find({ visitId }).populate(POPULATE_FIELDS).sort({ createdAt: -1 });
}

export async function getPrescriptionsByPatient(
  _: any,
  { patientId }: { patientId: string },
  ctx: ContextType
) {
  requireRole("doctor", "nurse", "superadmin")(ctx);
  return Prescription.find({ patientId }).populate(POPULATE_FIELDS).sort({ createdAt: -1 });
}

export async function getMyPrescriptions(
  _: any,
  { page = 1, limit = 20 }: { page?: number; limit?: number },
  ctx: ContextType
) {
  requireAuth(ctx);
  const patient = await Patient.findOne({ userId: ctx._id });
  if (!patient) throw new UserInputError("Өвчтөний бүртгэл олдсонгүй");

  return Prescription.find({ patientId: patient._id })
    .populate(POPULATE_FIELDS)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
}

// ─── Mutations ───

export async function createPrescription(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireRole("doctor")(ctx);

  const visit = await Visit.findById(input.visitId);
  if (!visit) throw new UserInputError("Үзлэг олдсонгүй");

  const doctorStaff = await Staff.findOne({ userId: ctx._id });
  if (!doctorStaff) throw new UserInputError("Эмчийн бүртгэл олдсонгүй");

  if (!input.items || input.items.length === 0) {
    throw new UserInputError("Жоронд дор хаяж нэг эм оруулна уу");
  }

  const prescriptionNumber = generateOrderNumber("RX");

  const prescription = new Prescription({
    visitId: input.visitId,
    patientId: visit.patientId,
    doctorId: doctorStaff._id,
    prescriptionNumber,
    items: input.items,
    notes: input.notes,
    status: "active",
    createdBy: ctx._id,
  });
  await prescription.save();

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "prescription",
    resourceId: prescription._id!.toString(),
    details: { prescriptionNumber, itemCount: input.items.length },
    ctx,
  });

  return prescription.populate(POPULATE_FIELDS);
}

export async function updatePrescriptionStatus(
  _: any,
  { _id, status }: { _id: string; status: string },
  ctx: ContextType
) {
  requireRole("doctor", "superadmin")(ctx);

  if (!["active", "dispensed", "cancelled"].includes(status)) {
    throw new UserInputError("Буруу төлөв");
  }

  const prescription = await Prescription.findByIdAndUpdate(
    _id,
    { status },
    { new: true }
  ).populate(POPULATE_FIELDS);

  if (!prescription) throw new UserInputError("Жор олдсонгүй");
  return prescription;
}
