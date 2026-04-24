import { User } from "../models/userModel";
import { Patient } from "../models/patientModel";
import {
  authenticate,
  encryptPassword,
  generateToken,
  requireAuth,
  requireRole,
} from "../utils/auth";
import { ContextType } from "../graphql/context";
import { GraphQLError } from "graphql";
import { UserInputError } from "apollo-server-errors";
import {
  messageSendToNumber,
  generateOtp,
  sendEmailOtp,
  generateRegistrationNumber,
} from "../utils/helper";
import { ROLES } from "../utils/constants";
import { logAudit } from "./auditService";

// ─── Queries ───

export async function me(_: any, __: any, ctx: ContextType) {
  if (!ctx._id || !ctx.authenticated) return null;
  return User.findById(ctx._id);
}

export async function getUser(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);
  return User.findById(_id);
}

export async function listUsers(
  _: any,
  { role }: { role: string },
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);
  return User.find({ role }).sort({ createdAt: -1 });
}

// ─── Mutations ───

export async function loginUser(
  _: any,
  { phone, password }: { phone: string; password: string },
  ctx: ContextType
) {
  const user = await User.findOne({ phone });
  if (!user) throw new UserInputError("Хэрэглэгч олдсонгүй");
  if (user.status === "suspended")
    throw new UserInputError("Бүртгэл түр хаагдсан байна");

  if (!authenticate(password, user.password as string)) {
    throw new UserInputError("Нууц үг буруу байна");
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken({
    _id: user._id!.toString(),
    phone: user.phone || "",
    role: user.role as string,
  });

  await logAudit({
    userId: user._id!.toString(),
    action: "login",
    resource: "user",
    resourceId: user._id!.toString(),
    ctx,
  });

  return { token, user };
}

export async function registerUser(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  // Validate role
  if (!ROLES.includes(input.role)) {
    throw new UserInputError(`Буруу role: ${input.role}`);
  }

  // Only superadmin can create non-patient users
  if (input.role !== "patient") {
    requireRole("superadmin")(ctx);
  }

  // Check duplicate phone
  const existing = await User.findOne({ phone: input.phone });
  if (existing) throw new UserInputError("Энэ утасны дугаар бүртгэлтэй байна");

  const userData = {
    ...input,
    password: encryptPassword(input.password),
  };

  const newUser = new User(userData);
  await newUser.save();

  await logAudit({
    userId: ctx._id || newUser._id!.toString(),
    action: "create",
    resource: "user",
    resourceId: newUser._id!.toString(),
    details: { role: input.role },
    ctx,
  });

  return newUser;
}

export async function updateMe(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireAuth(ctx);

  // Remove sensitive fields that users shouldn't update themselves
  delete input.role;
  delete input.status;
  delete input.password;

  const updatedUser = await User.findByIdAndUpdate(ctx._id, input, {
    new: true,
  });
  return updatedUser;
}

export async function changePassword(
  _: any,
  { password, newPassword }: { password: string; newPassword: string },
  ctx: ContextType
) {
  requireAuth(ctx);
  const user = await User.findById(ctx._id);
  if (!user) throw new UserInputError("Хэрэглэгч олдсонгүй");

  if (!authenticate(password, user.password as string)) {
    throw new UserInputError("Одоогийн нууц үг буруу байна");
  }

  user.password = encryptPassword(newPassword);
  await user.save();
  return "Нууц үг амжилттай солигдлоо";
}

// OTP store (in-memory for MVP, use Redis in production)
const otpStore = new Map<string, { code: string; expiresAt: number }>();
const emailOtpStore = new Map<string, { code: string; expiresAt: number }>();
const ALLOWED_PATIENT_EMAIL_DOMAINS = ["num.edu.mn", "stud.num.edu.mn"];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "patient";
  const normalized = localPart.replace(/[._-]+/g, " ").trim();
  const segments = normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .filter(Boolean);

  return {
    firstname: segments[0] || "Patient",
    lastname: segments.slice(1).join(" ") || "Self Registered",
  };
}

function assertAllowedPatientEmail(email: string) {
  const isAllowed = ALLOWED_PATIENT_EMAIL_DOMAINS.some((domain) =>
    email.endsWith(`@${domain}`)
  );

  if (!isAllowed) {
    throw new UserInputError("Зөвхөн МУИС-ийн мэйлээр нэвтрэх боломжтой");
  }
}

async function ensurePatientAccountByEmail(email: string) {
  const emailRegex = new RegExp(`^${escapeRegex(email)}$`, "i");
  let user = await User.findOne({ email: emailRegex });
  let patient = await Patient.findOne({ email: emailRegex });

  if (!user) {
    const name = patient
      ? {
          firstname: patient.firstname,
          lastname: patient.lastname,
        }
      : buildNameFromEmail(email);

    user = await User.create({
      email,
      firstname: name.firstname,
      lastname: name.lastname,
      role: "patient",
      status: "active",
    });
  } else if (user.email !== email) {
    user.email = email;
    await user.save();
  }

  if (patient && !patient.userId) {
    patient.userId = user._id;
    if (!patient.email) patient.email = email;
    await patient.save();
  }

  if (!patient) {
    let registrationNumber = generateRegistrationNumber();
    while (await Patient.findOne({ registrationNumber })) {
      registrationNumber = generateRegistrationNumber();
    }

    patient = await Patient.create({
      userId: user._id,
      registrationNumber,
      firstname: user.firstname,
      lastname: user.lastname,
      email,
      category: "external",
      status: "active",
    });
  }

  return { user, patient };
}

export async function forgotPassword(
  _: any,
  { phone }: { phone: string }
) {
  const user = await User.findOne({ phone });
  if (!user) throw new UserInputError("Хэрэглэгч олдсонгүй");

  const otp = generateOtp(4);
  otpStore.set(phone, { code: otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  await messageSendToNumber({ phoneNumber: phone, message: `Таны OTP код: ${otp}` });
  return "OTP код илгээгдлээ";
}

export async function verifyOTP(
  _: any,
  { input }: { input: { code: string; newPassword: string } }
) {
  for (const [phone, { code, expiresAt }] of otpStore.entries()) {
    if (code === input.code) {
      if (Date.now() > expiresAt) {
        otpStore.delete(phone);
        throw new GraphQLError("OTP-ийн хугацаа дууссан");
      }

      const user = await User.findOne({ phone });
      if (!user) throw new GraphQLError("Хэрэглэгч олдсонгүй");

      user.password = encryptPassword(input.newPassword);
      await user.save();
      otpStore.delete(phone);

      return "Нууц үг амжилттай шинэчлэгдлээ";
    }
  }
  throw new GraphQLError("OTP буруу байна");
}

export async function sendEmailLoginOTP(
  _: any,
  { email }: { email: string }
) {
  const normalizedEmail = email.trim().toLowerCase();
  assertAllowedPatientEmail(normalizedEmail);
  const { user } = await ensurePatientAccountByEmail(normalizedEmail);
  if (user.status === "suspended") {
    throw new UserInputError("Бүртгэл түр хаагдсан байна");
  }

  const otp = generateOtp(4);
  emailOtpStore.set(normalizedEmail, {
    code: otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  await sendEmailOtp({ to: normalizedEmail, otp });
  return "OTP код имэйлээр илгээгдлээ";
}

export async function loginWithEmailOTP(
  _: any,
  { email, code }: { email: string; code: string },
  ctx: ContextType
) {
  const normalizedEmail = email.trim().toLowerCase();
  assertAllowedPatientEmail(normalizedEmail);
  const otpEntry = emailOtpStore.get(normalizedEmail);

  if (!otpEntry || otpEntry.code !== code) {
    throw new UserInputError("OTP буруу байна");
  }

  if (Date.now() > otpEntry.expiresAt) {
    emailOtpStore.delete(normalizedEmail);
    throw new UserInputError("OTP-ийн хугацаа дууссан");
  }

  const emailRegex = new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i");
  const user = await User.findOne({ email: emailRegex });
  if (!user) {
    emailOtpStore.delete(normalizedEmail);
    throw new UserInputError("Хэрэглэгч олдсонгүй");
  }

  if (user.role !== "patient") {
    emailOtpStore.delete(normalizedEmail);
    throw new UserInputError("Энэ имэйл patient порталд тохирохгүй байна");
  }

  if (user.status === "suspended") {
    emailOtpStore.delete(normalizedEmail);
    throw new UserInputError("Бүртгэл түр хаагдсан байна");
  }

  emailOtpStore.delete(normalizedEmail);
  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken({
    _id: user._id!.toString(),
    phone: user.phone || "",
    role: user.role as string,
  });

  await logAudit({
    userId: user._id!.toString(),
    action: "login",
    resource: "user",
    resourceId: user._id!.toString(),
    details: { method: "email_otp" },
    ctx,
  });

  return { token, user };
}

export async function initiateOAuth(
  _: any,
  { provider, origin }: { provider: string; origin?: string }
) {
  // Placeholder — real implementation in oauthRoutes.ts (REST)
  if (provider === "num_sisi") {
    return {
      redirectUrl: `/auth/sisi?origin=${origin || "patient"}`,
    };
  }
  throw new GraphQLError("Дэмжигдээгүй provider");
}
