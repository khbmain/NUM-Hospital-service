import { Patient } from "../models/patientModel";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";
import { UserInputError } from "apollo-server-errors";
import { generateRegistrationNumber } from "../utils/helper";
import { logAudit } from "./auditService";

// ─── Queries ───

export async function searchPatients(
  _: any,
  { query, page = 1, limit = 20 }: { query: string; page?: number; limit?: number },
  ctx: ContextType
) {
  requireRole("data_operator", "doctor", "nurse", "superadmin")(ctx);

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
  requireRole("data_operator", "doctor", "nurse", "superadmin")(ctx);
  return Patient.findById(_id).populate("userId registeredBy");
}

export async function getPatientByRegistration(
  _: any,
  { registrationNumber }: { registrationNumber: string },
  ctx: ContextType
) {
  requireRole("data_operator", "doctor", "nurse", "superadmin")(ctx);
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
  requireRole("data_operator", "superadmin")(ctx);

  // Generate unique registration number
  let registrationNumber = generateRegistrationNumber();
  // Ensure uniqueness (rare collision)
  while (await Patient.findOne({ registrationNumber })) {
    registrationNumber = generateRegistrationNumber();
  }

  const patient = new Patient({
    ...input,
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
  requireRole("data_operator", "superadmin")(ctx);

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
