import { Visit } from "../models/visitModel";
import { VitalSign } from "../models/vitalSignModel";
import { Appointment } from "../models/appointmentModel";
import { Patient } from "../models/patientModel";
import { Diagnosis } from "../models/diagnosisModel";
import { Prescription } from "../models/prescriptionModel";
import { Staff } from "../models/staffModel";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";
import { messageSendToNumber, sendEmail } from "../utils/helper";
import { PATIENT_FRONTEND_URL } from "../utils/constants";
import { UserInputError } from "apollo-server-errors";
import { logAudit } from "./auditService";
import { createNotification } from "./notificationService";
import { ensurePatientAccountByPhone } from "./authService";

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

function getDayBounds(date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
}

function formatTime(date: Date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function getPatientPortalUrl(appointmentId?: any) {
  const baseUrl = PATIENT_FRONTEND_URL || process.env.CLIENT_URL || "http://202.131.1.77:3100";
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  return appointmentId ? `${cleanBaseUrl}/appointments/${appointmentId}` : `${cleanBaseUrl}/visits`;
}

function formatDateTime(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function notifyPatientVisitCompleted(visit: any) {
  const populatedVisit: any = await Visit.findById(visit._id)
    .populate([
      { path: "patientId", populate: [{ path: "userId" }] },
      { path: "appointmentId", populate: [{ path: "serviceId" }] },
    ]);
  const patient: any = populatedVisit?.patientId;
  if (!patient) return;

  const appointment: any = populatedVisit.appointmentId;
  const portalUrl = getPatientPortalUrl(appointment?._id);
  const patientName = `${patient.lastname || ""} ${patient.firstname || ""}`.trim();
  const dateLabel = formatDateTime(populatedVisit.completedAt || populatedVisit.visitDate);
  const serviceName = appointment?.serviceId?.name || "үзлэг";
  const subject = "NUM Hospital: Үзлэгийн мэдээлэл бэлэн боллоо";
  const baseMessage = [
    `Сайн байна уу${patientName ? `, ${patientName}` : ""}.`,
    `Таны ${dateLabel}-ны ${serviceName}ийн мэдээлэл patient портал дээр бэлэн боллоо.`,
    `Өөрийн үзлэгийн мэдээллээ харах бол энэ линкээр орно уу: ${portalUrl}`,
  ].join("\n");

  try {
    if (patient.userId) {
      const userId = patient.userId._id?.toString() || patient.userId.toString();
      await createNotification({
        userId,
        title: "Үзлэгийн мэдээлэл бэлэн боллоо",
        body: { visitId: populatedVisit._id, appointmentId: appointment?._id, url: portalUrl },
        type: "treatment",
      });
    }

    const email = patient.email || patient.userId?.email;
    if (email) {
      try {
        const result = await sendEmail({ to: email, subject, text: baseMessage });
        if (result === "Email sent") return;
      } catch (emailError) {
        console.error("Failed to send completed visit email", emailError);
      }
    }

    if (patient.phone) {
      await ensurePatientAccountByPhone(patient);
      await messageSendToNumber({
        phoneNumber: patient.phone,
        message: [
          "NUM Hospital: Таны үзлэг дууслаа.",
          "Та үзлэгийн мэдээллээ шалгах бол доорх линкээр орно уу.",
          `Линк: ${portalUrl}`,
        ].join("\n"),
      });
    }
  } catch (error) {
    console.error("Failed to notify patient about completed visit", error);
  }
}

async function createWalkInAppointment(input: any, doctorId: any, ctx: ContextType) {
  const now = new Date();
  const scheduledEnd = new Date(now.getTime() + 30 * 60 * 1000);
  const { dayStart, dayEnd } = getDayBounds(now);
  const todayCount = await Appointment.countDocuments({
    doctorId,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ["cancelled", "no_show"] },
  });

  const appointment = new Appointment({
    patientId: input.patientId,
    doctorId,
    scheduledDate: now,
    scheduledTime: formatTime(now),
    scheduledStart: now,
    scheduledEnd,
    blockedUntil: scheduledEnd,
    duration: 30,
    durationMinutes: 30,
    bufferMinutes: 0,
    appointmentKind: input.appointmentKind || "consultation",
    type: "walk_in",
    status: "in_progress",
    queueNumber: todayCount + 1,
    chiefComplaint: input.chiefComplaint,
    createdBy: ctx._id,
    checkedInAt: now,
    checkedInBy: ctx._id,
  });
  await appointment.save();

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "appointment",
    resourceId: appointment._id!.toString(),
    details: { type: "walk_in" },
    ctx,
  });

  return appointment;
}

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

    const appointment = await Appointment.findById(input.appointmentId);
    if (!appointment) throw new UserInputError("Цаг захиалга олдсонгүй");
    if (["completed", "cancelled", "no_show"].includes(appointment.status)) {
      throw new UserInputError("Энэ цагтай холбогдсон үзлэгийн бүртгэл олдсонгүй");
    }
  }

  const doctorId = doctorStaff?._id || input.doctorId;
  const walkInAppointment = input.appointmentId ? null : await createWalkInAppointment(input, doctorId, ctx);

  const visit = new Visit({
    appointmentId: input.appointmentId || walkInAppointment?._id || undefined,
    patientId: input.patientId,
    doctorId,
    visitDate: new Date(),
    status: "active",
    visitType: input.visitType || (input.appointmentId ? "scheduled" : "walk_in"),
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

  await notifyPatientVisitCompleted(visit);

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
