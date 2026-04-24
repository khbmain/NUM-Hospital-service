// @ts-nocheck
import mongoose from "mongoose";
import { encryptPassword } from "./utils/auth";
import { MONGODB_URI } from "./utils/constants";
import { Department } from "./models/departmentModel";
import { User } from "./models/userModel";
import { Staff } from "./models/staffModel";
import { Service } from "./models/serviceModel";
import { Resource } from "./models/resourceModel";
import { Patient } from "./models/patientModel";
import { Appointment } from "./models/appointmentModel";
import { Visit } from "./models/visitModel";
import { VitalSign } from "./models/vitalSignModel";
import { Diagnosis } from "./models/diagnosisModel";
import { Prescription } from "./models/prescriptionModel";
import { Notification } from "./models/notificationModel";
import { AuditLog } from "./models/auditLogModel";
import { UnavailableBlock } from "./models/unavailableBlockModel";

export async function connectDb() {
  await mongoose.connect(MONGODB_URI);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function withTime(base: Date, hour: number, minute = 0) {
  const date = new Date(base);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function plusDays(base: Date, days: number, hour = 9, minute = 0) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return withTime(date, hour, minute);
}

export function buildWorkWeek(startTime = "08:30", endTime = "17:30") {
  return [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startTime, endTime }));
}

export async function upsertDepartment(data: {
  code: string;
  name: string;
  description: string;
}) {
  return Department.findOneAndUpdate(
    { code: data.code },
    { $set: { ...data, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertUser(data: {
  phone: string;
  password: string;
  firstname: string;
  lastname: string;
  role: string;
  email?: string;
  gender?: "male" | "female" | "other";
  birthdate?: Date;
}) {
  return User.findOneAndUpdate(
    { phone: data.phone },
    {
      $set: {
        phone: data.phone,
        password: encryptPassword(data.password),
        firstname: data.firstname,
        lastname: data.lastname,
        role: data.role,
        email: data.email,
        gender: data.gender,
        birthdate: data.birthdate,
        status: "active",
        phoneVerified: true,
        lastLoginAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertStaff(data: {
  userId: any;
  departmentId?: any;
  staffType: "doctor" | "nurse" | "admin_staff";
  specialization?: string;
  licenseNumber?: string;
  title?: string;
  bio?: string;
  maxDailyAppointments?: number;
  startTime?: string;
  endTime?: string;
}) {
  return Staff.findOneAndUpdate(
    { userId: data.userId },
    {
      $set: {
        userId: data.userId,
        departmentId: data.departmentId,
        staffType: data.staffType,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        title: data.title,
        bio: data.bio,
        maxDailyAppointments: data.maxDailyAppointments || 20,
        isAvailable: true,
        status: "active",
        workSchedule: buildWorkWeek(data.startTime || "08:30", data.endTime || "17:30"),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertService(data: {
  code: string;
  name: string;
  category: "consultation" | "injection" | "infusion" | "procedure" | "device" | "lab" | "other";
  description?: string;
  defaultDurationMinutes?: number;
  defaultBufferMinutes?: number;
  requiresDoctor?: boolean;
  requiresNurse?: boolean;
  requiresDevice?: boolean;
}) {
  return Service.findOneAndUpdate(
    { code: data.code },
    { $set: { ...data, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertResource(data: {
  name: string;
  type: "doctor" | "nurse" | "device" | "room" | "capacity_room";
  category?: string;
  staffId?: any;
  serviceIds?: any[];
  room?: string;
  capacity?: number;
  slotIntervalMinutes?: number;
  defaultDurationMinutes?: number;
  defaultBufferMinutes?: number;
  notes?: string;
}) {
  return Resource.findOneAndUpdate(
    { name: data.name },
    {
      $set: {
        ...data,
        isActive: true,
        workSchedule: buildWorkWeek("09:00", "17:00"),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertPatient(data: {
  registrationNumber: string;
  firstname: string;
  lastname: string;
  phone: string;
  email?: string;
  gender: "male" | "female" | "other";
  birthdate: Date;
  category: "student" | "teacher" | "employee" | "external";
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  regularMedications?: string[];
  medicalWarnings?: string[];
  address?: string;
  notes?: string;
  universityId?: string;
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
  registeredBy: any;
  userId?: any;
}) {
  return Patient.findOneAndUpdate(
    { registrationNumber: data.registrationNumber },
    {
      $set: {
        ...data,
        bloodType: data.bloodType || "unknown",
        address: data.address || "Улаанбаатар хот",
        emergencyContact: data.emergencyContact || {
          name: "Ар гэр",
          phone: "99112233",
          relationship: "Гэр бүл",
        },
        status: "active",
        profileCompletedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertAppointment(data: {
  patientId: any;
  doctorId?: any;
  nurseId?: any;
  assignedStaffId?: any;
  serviceId?: any;
  resourceId?: any;
  departmentId?: any;
  scheduledDate: Date;
  scheduledTime: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  blockedUntil: Date;
  durationMinutes: number;
  bufferMinutes: number;
  appointmentKind: string;
  type: "walk_in" | "scheduled" | "follow_up" | "emergency";
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled" | "no_show";
  queueNumber?: number;
  chiefComplaint?: string;
  notes?: string;
  createdBy: any;
  checkedInBy?: any;
  checkedInAt?: Date;
  cancelReason?: string;
  cancelledAt?: Date;
  cancelledBy?: any;
}) {
  return Appointment.findOneAndUpdate(
    {
      patientId: data.patientId,
      scheduledStart: data.scheduledStart,
      serviceId: data.serviceId || null,
    },
    {
      $set: {
        ...data,
        duration: data.durationMinutes,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertVisit(data: {
  appointmentId?: any;
  patientId: any;
  doctorId: any;
  visitDate: Date;
  visitType: "scheduled" | "walk_in" | "follow_up" | "doctor_created";
  status: "draft" | "active" | "completed" | "cancelled";
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  notes?: string;
  createdBy: any;
  completedAt?: Date;
}) {
  return Visit.findOneAndUpdate(
    data.appointmentId ? { appointmentId: data.appointmentId } : { patientId: data.patientId, visitDate: data.visitDate },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertVital(data: {
  visitId: any;
  patientId: any;
  recordedBy: any;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}) {
  const next = { ...data };
  if (next.weight && next.height) {
    const hm = next.height / 100;
    next.bmi = Number((next.weight / (hm * hm)).toFixed(1));
  }
  return VitalSign.findOneAndUpdate(
    { visitId: data.visitId },
    { $set: next },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertDiagnosis(data: {
  visitId: any;
  patientId: any;
  doctorId: any;
  icdCode?: string;
  icdTitle?: string;
  icdLinearizationUri?: string;
  icdFoundationUri?: string;
  icdParentUri?: string;
  name: string;
  description?: string;
  type: "primary" | "secondary" | "differential";
  severity?: "mild" | "moderate" | "severe" | "critical";
  notes?: string;
  createdBy: any;
}) {
  return Diagnosis.findOneAndUpdate(
    { visitId: data.visitId, name: data.name, type: data.type },
    {
      $set: {
        ...data,
        icdVersion: "2026-01",
        icdLinearization: "mms",
        icdLanguage: "en",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertPrescription(data: {
  prescriptionNumber: string;
  visitId: any;
  patientId: any;
  doctorId: any;
  status: "active" | "dispensed" | "cancelled";
  notes?: string;
  createdBy: any;
  items: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration?: string;
    quantity?: number;
    unit?: string;
    instructions?: string;
  }>;
}) {
  return Prescription.findOneAndUpdate(
    { prescriptionNumber: data.prescriptionNumber },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function upsertUnavailableBlock(data: {
  serviceId?: any;
  resourceId?: any;
  staffId?: any;
  startAt: Date;
  endAt: Date;
  reason: string;
  note?: string;
  createdBy: any;
  status?: "active" | "cancelled";
}) {
  return UnavailableBlock.findOneAndUpdate(
    {
      resourceId: data.resourceId || null,
      staffId: data.staffId || null,
      startAt: data.startAt,
      endAt: data.endAt,
    },
    {
      $set: {
        ...data,
        status: data.status || "active",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function replaceNotifications(seedTag: string, entries: Array<any>) {
  await Notification.deleteMany({ "body.seedTag": seedTag });
  if (!entries.length) return;
  await Notification.insertMany(
    entries.map((entry) => ({
      ...entry,
      body: { ...(entry.body || {}), seedTag },
      createdAt: entry.createdAt || new Date(),
      updatedAt: new Date(),
    })),
  );
}

export async function replaceAuditLogs(seedTag: string, entries: Array<any>) {
  await AuditLog.deleteMany({ "details.seedTag": seedTag });
  if (!entries.length) return;
  await AuditLog.insertMany(
    entries.map((entry) => ({
      ...entry,
      details: { ...(entry.details || {}), seedTag },
      ipAddress: entry.ipAddress || "127.0.0.1",
      userAgent: entry.userAgent || "seed-script",
      createdAt: entry.createdAt || new Date(),
      updatedAt: new Date(),
    })),
  );
}

export async function countSummary() {
  const [departments, users, staff, services, resources, patients, appointments, visits, prescriptions] = await Promise.all([
    Department.countDocuments(),
    User.countDocuments(),
    Staff.countDocuments(),
    Service.countDocuments(),
    Resource.countDocuments(),
    Patient.countDocuments(),
    Appointment.countDocuments(),
    Visit.countDocuments(),
    Prescription.countDocuments(),
  ]);

  return { departments, users, staff, services, resources, patients, appointments, visits, prescriptions };
}
