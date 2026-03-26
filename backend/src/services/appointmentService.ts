import { Appointment } from "../models/appointmentModel";
import { Patient } from "../models/patientModel";
import { Staff } from "../models/staffModel";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";
import { UserInputError } from "apollo-server-errors";
import { GraphQLError } from "graphql";
import { logAudit } from "./auditService";

const APPOINTMENT_POPULATE = [
  { path: "patientId" },
  {
    path: "doctorId",
    populate: [
      { path: "userId" },
      { path: "departmentId" },
    ],
  },
  { path: "departmentId" },
  { path: "checkedInBy" },
  { path: "createdBy" },
];

// ─── Queries ───

export async function getAppointment(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireAuth(ctx);
  return Appointment.findById(_id).populate(APPOINTMENT_POPULATE);
}

export async function listAppointments(
  _: any,
  { filter }: { filter: any },
  ctx: ContextType
) {
  requireRole("data_operator", "doctor", "superadmin")(ctx);

  const query: any = {};
  if (filter.doctorId) query.doctorId = filter.doctorId;
  if (filter.patientId) query.patientId = filter.patientId;
  if (filter.departmentId) query.departmentId = filter.departmentId;
  if (filter.status) query.status = filter.status;
  if (filter.dateFrom || filter.dateTo) {
    query.scheduledDate = {};
    if (filter.dateFrom) query.scheduledDate.$gte = new Date(filter.dateFrom);
    if (filter.dateTo) query.scheduledDate.$lte = new Date(filter.dateTo);
  }

  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate(APPOINTMENT_POPULATE)
      .sort({ scheduledDate: -1, scheduledTime: 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(query),
  ]);

  return { appointments, total };
}

export async function getMyAppointments(
  _: any,
  { status, page = 1, limit = 20 }: { status?: string; page?: number; limit?: number },
  ctx: ContextType
) {
  requireAuth(ctx);

  // Find patient by userId
  const patient = await Patient.findOne({ userId: ctx._id });
  if (!patient) throw new UserInputError("Өвчтөний бүртгэл олдсонгүй");

  const query: any = { patientId: patient._id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate(APPOINTMENT_POPULATE)
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(query),
  ]);

  return { appointments, total };
}

export async function getDoctorQueue(
  _: any,
  { doctorId, date }: { doctorId: string; date: Date },
  ctx: ContextType
) {
  requireRole("doctor", "data_operator", "superadmin")(ctx);

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return Appointment.find({
    doctorId,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ["scheduled", "checked_in", "in_progress"] },
  })
    .populate(APPOINTMENT_POPULATE)
    .sort({ queueNumber: 1, scheduledTime: 1 });
}

export async function getAvailableSlots(
  _: any,
  { doctorId, date }: { doctorId: string; date: Date },
  ctx: ContextType
) {
  requireAuth(ctx);

  const staff = await Staff.findById(doctorId);
  if (!staff) throw new UserInputError("Эмч олдсонгүй");

  // Generate all possible 30-min slots (09:00 - 17:00)
  const allSlots: string[] = [];
  for (let h = 9; h < 17; h++) {
    allSlots.push(`${h.toString().padStart(2, "0")}:00`);
    allSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  // Find existing appointments for that day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await Appointment.find({
    doctorId,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ["cancelled", "no_show"] },
  });

  const takenSlots = new Set(existing.map((a) => a.scheduledTime));
  return allSlots.filter((slot) => !takenSlots.has(slot));
}

// ─── Mutations ───

export async function createAppointment(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireAuth(ctx);

  // Validate patient exists
  const patient = await Patient.findById(input.patientId);
  if (!patient) throw new UserInputError("Өвчтөн олдсонгүй");

  // Validate doctor exists and is available
  const doctor = await Staff.findById(input.doctorId);
  if (!doctor || doctor.staffType !== "doctor")
    throw new UserInputError("Эмч олдсонгүй");

  // Check slot availability
  const dayStart = new Date(input.scheduledDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(input.scheduledDate);
  dayEnd.setHours(23, 59, 59, 999);

  const conflict = await Appointment.findOne({
    doctorId: input.doctorId,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    scheduledTime: input.scheduledTime,
    status: { $nin: ["cancelled", "no_show"] },
  });
  if (conflict)
    throw new UserInputError("Энэ цагт өөр захиалга бүртгэгдсэн байна");

  // Auto queue number
  const todayCount = await Appointment.countDocuments({
    doctorId: input.doctorId,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ["cancelled", "no_show"] },
  });

  const appointment = new Appointment({
    ...input,
    queueNumber: todayCount + 1,
    status: "scheduled",
    createdBy: ctx._id,
  });
  await appointment.save();

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "appointment",
    resourceId: appointment._id!.toString(),
    ctx,
  });

  return appointment.populate(APPOINTMENT_POPULATE);
}

export async function checkInAppointment(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("data_operator", "superadmin")(ctx);

  const appointment = await Appointment.findById(_id);
  if (!appointment) throw new UserInputError("Цаг захиалга олдсонгүй");
  if (appointment.status !== "scheduled")
    throw new UserInputError("Зөвхөн 'scheduled' төлөвтэй цагийг check-in хийх боломжтой");

  appointment.status = "checked_in";
  appointment.checkedInAt = new Date();
  appointment.checkedInBy = ctx._id as any;
  await appointment.save();

  return appointment.populate(APPOINTMENT_POPULATE);
}

export async function startAppointment(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("doctor", "superadmin")(ctx);

  const appointment = await Appointment.findById(_id);
  if (!appointment) throw new UserInputError("Цаг захиалга олдсонгүй");
  if (appointment.status !== "checked_in")
    throw new UserInputError("Зөвхөн check-in хийгдсэн цагийг эхлүүлэх боломжтой");

  appointment.status = "in_progress";
  await appointment.save();

  return appointment.populate(APPOINTMENT_POPULATE);
}

export async function completeAppointment(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("doctor", "superadmin")(ctx);

  const appointment = await Appointment.findById(_id);
  if (!appointment) throw new UserInputError("Цаг захиалга олдсонгүй");

  appointment.status = "completed";
  await appointment.save();

  return appointment.populate(APPOINTMENT_POPULATE);
}

export async function cancelAppointment(
  _: any,
  { _id, reason }: { _id: string; reason?: string },
  ctx: ContextType
) {
  requireAuth(ctx);

  const appointment = await Appointment.findById(_id);
  if (!appointment) throw new UserInputError("Цаг захиалга олдсонгүй");
  if (["completed", "cancelled"].includes(appointment.status))
    throw new UserInputError("Энэ цагийг цуцлах боломжгүй");

  appointment.status = "cancelled";
  appointment.cancelledAt = new Date();
  const trimmedReason = reason?.trim();
  if (!trimmedReason) throw new UserInputError("Цуцлах шалтгаан заавал оруулна");
  appointment.cancelReason = trimmedReason;
  await appointment.save();

  return appointment.populate(APPOINTMENT_POPULATE);
}

export async function markNoShow(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("data_operator", "doctor", "superadmin")(ctx);

  const appointment = await Appointment.findById(_id);
  if (!appointment) throw new UserInputError("Цаг захиалга олдсонгүй");

  appointment.status = "no_show";
  await appointment.save();

  return appointment.populate(APPOINTMENT_POPULATE);
}
