import { Patient } from "../models/patientModel";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";
import { UserInputError } from "apollo-server-errors";
import { generateRegistrationNumber } from "../utils/helper";
import { logAudit } from "./auditService";

function isProfileComplete(input: any) {
  return Boolean(
    input.registrationNumber &&
    input.firstname &&
    input.lastname &&
    input.phone &&
    input.gender &&
    input.birthdate
  );
}

// ─── Queries ───

export async function searchPatients(
  _: any,
  { query, page = 1, limit = 20 }: { query: string; page?: number; limit?: number },
  ctx: ContextType
) {
  requireRole("doctor", "nurse", "receptionist", "superadmin")(ctx);

  const trimmedQuery = query.trim();
  const filter = trimmedQuery
    ? {
        $or: [
          { firstname: new RegExp(trimmedQuery, "i") },
          { lastname: new RegExp(trimmedQuery, "i") },
          { phone: new RegExp(trimmedQuery, "i") },
          { registrationNumber: new RegExp(trimmedQuery, "i") },
          { nationalId: new RegExp(trimmedQuery, "i") },
          { sisiId: new RegExp(trimmedQuery, "i") },
        ],
      }
    : {};

  const skip = (page - 1) * limit;
  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .populate("userId registeredBy")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Patient.countDocuments(filter),
  ]);

  return { patients, total, page, limit };
}

export async function getPatient(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("doctor", "nurse", "receptionist", "superadmin")(ctx);
  return Patient.findById(_id).populate("userId registeredBy");
}

export async function getPatientByRegistration(
  _: any,
  { registrationNumber }: { registrationNumber: string },
  ctx: ContextType
) {
  requireRole("doctor", "nurse", "receptionist", "superadmin")(ctx);
  return Patient.findOne({ registrationNumber }).populate("userId registeredBy");
}

export async function getMyPatientProfile(
  _: any,
  __: any,
  ctx: ContextType
) {
  requireAuth(ctx);
  return Patient.findOne({ userId: ctx._id }).populate("userId");
}

// ─── Mutations ───

export async function createPatient(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireRole("doctor", "receptionist", "superadmin")(ctx);

  let registrationNumber = input.registrationNumber?.trim();
  if (registrationNumber) {
    const existing = await Patient.findOne({ registrationNumber });
    if (existing) throw new UserInputError("Энэ регистрийн дугаартай өвчтөн бүртгэлтэй байна");
  } else {
    registrationNumber = generateRegistrationNumber();
    while (await Patient.findOne({ registrationNumber })) {
      registrationNumber = generateRegistrationNumber();
    }
  }

  const { registrationNumber: _registrationNumber, ...patientInput } = input;
  const patient = new Patient({
    ...patientInput,
    registrationNumber,
    registeredBy: ctx._id,
  });
  await patient.save();

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "patient",
    resourceId: patient._id!.toString(),
    details: { registrationNumber },
    ctx,
  });

  return patient.populate("userId registeredBy");
}

export async function updatePatient(
  _: any,
  { _id, input }: { _id: string; input: any },
  ctx: ContextType
) {
  requireRole("doctor", "superadmin")(ctx);

  const patient = await Patient.findByIdAndUpdate(_id, input, { new: true })
    .populate("userId registeredBy");

  if (!patient) throw new UserInputError("Өвчтөн олдсонгүй");

  await logAudit({
    userId: ctx._id,
    action: "update",
    resource: "patient",
    resourceId: _id,
    details: { fields: Object.keys(input) },
    ctx,
  });

  return patient;
}

export async function upsertMyPatientProfile(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireAuth(ctx);

  const registrationNumber = input.registrationNumber?.trim().toUpperCase();
  if (!/^[А-ЯЁӨҮ]{2}[0-9]{8}$/.test(registrationNumber || "")) {
    throw new UserInputError("Регистрийн дугаар 2 кирилл үсэг + 8 цифртэй байна. Жишээ: УБ12345678");
  }

  input.registrationNumber = registrationNumber;

  const existingByRegistration = input.registrationNumber
    ? await Patient.findOne({ registrationNumber: input.registrationNumber })
    : null;
  if (existingByRegistration && existingByRegistration.userId?.toString() !== ctx._id?.toString()) {
    throw new UserInputError("Энэ регистрийн дугаартай өвчтөн бүртгэлтэй байна. Админтай холбогдоно уу.");
  }

  let patient = await Patient.findOne({ userId: ctx._id });
  const payload = {
    ...input,
    userId: ctx._id,
    category: input.category || "external",
    profileCompletedAt: isProfileComplete(input) ? new Date() : undefined,
  };

  if (patient) {
    Object.assign(patient, payload);
  } else {
    patient = new Patient({
      ...payload,
      registrationNumber: input.registrationNumber || generateRegistrationNumber(),
      registeredBy: ctx._id,
    });
  }

  await patient.save();
  await logAudit({
    userId: ctx._id,
    action: "upsert",
    resource: "patient_profile",
    resourceId: patient._id!.toString(),
    ctx,
  });

  return patient.populate("userId registeredBy");
}
