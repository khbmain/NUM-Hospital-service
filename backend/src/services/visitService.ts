import { Visit } from "../models/visitModel";
import { VitalSign } from "../models/vitalSignModel";
import { Appointment } from "../models/appointmentModel";
import { Patient } from "../models/patientModel";
import { Diagnosis } from "../models/diagnosisModel";
import { Prescription } from "../models/prescriptionModel";
import { Staff } from "../models/staffModel";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";
import { UserInputError } from "apollo-server-errors";
import { logAudit } from "./auditService";

const POPULATE_FIELDS = [
  { path: "patientId" },
  {
    path: "doctorId",
    populate: [
      { path: "userId" },
      { path: "departmentId" },
    ],
  },
  {
    path: "appointmentId",
    populate: [
      { path: "doctorId", populate: [{ path: "userId" }, { path: "departmentId" }] },
      { path: "serviceId" },
      { path: "resourceId" },
      { path: "departmentId" },
    ],
  },
  { path: "createdBy" },
];

// ─── Queries ───

export async function getVisit(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireAuth(ctx);
  return Visit.findById(_id).populate(POPULATE_FIELDS);
}

export async function listVisitsByPatient(
  _: any,
  { patientId, page = 1, limit = 20 }: { patientId: string; page?: number; limit?: number },
  ctx: ContextType
) {
  requireRole("doctor", "nurse", "superadmin")(ctx);
  return Visit.find({ patientId })
    .populate(POPULATE_FIELDS)
    .sort({ visitDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
}

export async function getMyVisitHistory(
  _: any,
  { page = 1, limit = 20 }: { page?: number; limit?: number },
  ctx: ContextType
) {
  requireAuth(ctx);
  const patient = await Patient.findOne({ userId: ctx._id });
  if (!patient) throw new UserInputError("Өвчтөний бүртгэл олдсонгүй");

  return Visit.find({ patientId: patient._id })
    .populate(POPULATE_FIELDS)
    .sort({ visitDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
}

export async function getMyVisitByAppointment(
  _: any,
  { appointmentId }: { appointmentId: string },
  ctx: ContextType
) {
  requireAuth(ctx);
  const patient = await Patient.findOne({ userId: ctx._id });
  if (!patient) throw new UserInputError("Өвчтөний бүртгэл олдсонгүй");

  return Visit.findOne({ appointmentId, patientId: patient._id }).populate(POPULATE_FIELDS);
}

export async function getTodayVisits(
  _: any,
  { doctorId }: { doctorId?: string },
  ctx: ContextType
) {
  requireRole("doctor", "superadmin")(ctx);

  const targetDoctorId = doctorId || (await Staff.findOne({ userId: ctx._id }))?._id;
  if (!targetDoctorId) throw new UserInputError("Эмчийн бүртгэл олдсонгүй");

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  return Visit.find({
    doctorId: targetDoctorId,
    visitDate: { $gte: dayStart, $lte: dayEnd },
  })
    .populate(POPULATE_FIELDS)
    .sort({ createdAt: 1 });
}

// ─── Mutations ───

export async function createVisit(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireRole("doctor", "superadmin")(ctx);

  // Get doctor's staff record
  const doctorStaff = await Staff.findOne({ userId: ctx._id });
  if (!doctorStaff && ctx.role === "doctor")
    throw new UserInputError("Эмчийн бүртгэл олдсонгүй");

  if (input.appointmentId) {
    const existingVisit = await Visit.findOne({ appointmentId: input.appointmentId });
    if (existingVisit) {
      await Appointment.findByIdAndUpdate(input.appointmentId, {
        status: existingVisit.status === "completed" ? "completed" : "in_progress",
      });
      return existingVisit.populate(POPULATE_FIELDS);
    }
  }

  const visit = new Visit({
    appointmentId: input.appointmentId || undefined,
    patientId: input.patientId,
    doctorId: doctorStaff?._id || input.doctorId,
    visitDate: new Date(),
    status: "active",
    visitType: input.visitType || (input.appointmentId ? "scheduled" : "doctor_created"),
    chiefComplaint: input.chiefComplaint,
    createdBy: ctx._id,
  });
  await visit.save();

  // Update appointment status if linked
  if (input.appointmentId) {
    await Appointment.findByIdAndUpdate(input.appointmentId, {
      status: "in_progress",
    });
  }

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "visit",
    resourceId: visit._id!.toString(),
    ctx,
  });

  return visit.populate(POPULATE_FIELDS);
}

export async function updateVisit(
  _: any,
  { _id, input }: { _id: string; input: any },
  ctx: ContextType
) {
  requireRole("doctor")(ctx);

  const visit = await Visit.findById(_id);
  if (!visit) throw new UserInputError("Үзлэг олдсонгүй");
  if (visit.status === "completed")
    throw new UserInputError("Дууссан үзлэгийг засах боломжгүй");

  Object.assign(visit, input);
  await visit.save();

  return visit.populate(POPULATE_FIELDS);
}

export async function completeVisit(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("doctor")(ctx);

  const visit = await Visit.findById(_id);
  if (!visit) throw new UserInputError("Үзлэг олдсонгүй");

  visit.status = "completed";
  visit.completedAt = new Date();
  await visit.save();

  // Complete linked appointment
  if (visit.appointmentId) {
    await Appointment.findByIdAndUpdate(visit.appointmentId, {
      status: "completed",
    });
  }

  await logAudit({
    userId: ctx._id,
    action: "update",
    resource: "visit",
    resourceId: _id,
    details: { action: "completed" },
    ctx,
  });

  return visit.populate(POPULATE_FIELDS);
}

export async function recordVitalSigns(
  _: any,
  { visitId, input }: { visitId: string; input: any },
  ctx: ContextType
) {
  requireRole("doctor", "nurse")(ctx);

  const visit = await Visit.findById(visitId);
  if (!visit) throw new UserInputError("Үзлэг олдсонгүй");

  // Upsert vital signs for this visit
  const nextInput = { ...input };
  if (nextInput.weight && nextInput.height) {
    const heightInMeters = nextInput.height / 100;
    nextInput.bmi = Number((nextInput.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  const vitalSign = await VitalSign.findOneAndUpdate(
    { visitId },
    {
      ...nextInput,
      visitId,
      patientId: visit.patientId,
      recordedBy: ctx._id,
    },
    { upsert: true, new: true }
  );

  return vitalSign;
}

// ─── Field Resolvers (for nested data) ───

export async function resolveVisitVitalSigns(visit: any) {
  return VitalSign.findOne({ visitId: visit._id });
}

export async function resolveVisitDiagnoses(visit: any) {
  return Diagnosis.find({ visitId: visit._id }).sort({ createdAt: 1 });
}

export async function resolveVisitPrescriptions(visit: any) {
  return Prescription.find({ visitId: visit._id }).sort({ createdAt: 1 });
}
