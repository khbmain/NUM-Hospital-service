import { User } from "../models/userModel";
import { Patient } from "../models/patientModel";
import {
  authenticate,
  clearAuthCookie,
  encryptPassword,
  generateToken,
  requireAuth,
  requireRole,
  setAuthCookie,
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
import { ADMIN_FRONTEND_URL, PATIENT_FRONTEND_URL, ROLES } from "../utils/constants";
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
  const loginIdentifier = normalizeLoginIdentifier(phone);
  const user = await User.findOne(loginIdentifier.includes("@")
    ? { email: loginIdentifier }
    : { phone: loginIdentifier });
  if (!user) throw new UserInputError("Хэрэглэгч олдсонгүй");
  if (user.status === "suspended")
    throw new UserInputError("Бүртгэл түр хаагдсан байна");

  if (!user.password || !authenticate(password, user.password as string)) {
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

  setAuthCookie(ctx.res, token);

  return { user };
}

export async function logoutUser(_: any, __: any, ctx: ContextType) {
  clearAuthCookie(ctx.res);
  return true;
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

  const normalizedPhone = normalizePhone(input.phone);
  if (!normalizedPhone) throw new UserInputError("Утасны дугаар оруулна уу");

  // Check duplicate phone
  const existing = await User.findOne({ phone: normalizedPhone });
  if (existing) throw new UserInputError("Энэ утасны дугаар бүртгэлтэй байна");

  const generatedPassword = generateInitialPassword();
  const userData = {
    ...input,
    phone: normalizedPhone,
    password: encryptPassword(generatedPassword),
  };

  const newUser = new User(userData);
  await newUser.save();

  await sendRegistrationSms({
    phone: normalizedPhone,
    password: generatedPassword,
    role: input.role,
  });

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

export function normalizePhone(phone?: string | null) {
  return String(phone || "").replace(/\s+/g, "").trim();
}

function normalizeLoginIdentifier(identifier?: string | null) {
  const normalized = normalizePhone(identifier);
  return normalized.includes("@") ? normalized.toLowerCase() : normalized;
}

export function generateInitialPassword() {
  return generateOtp(6);
}

function registrationSiteUrl(role: string) {
  return role === "patient" ? PATIENT_FRONTEND_URL : ADMIN_FRONTEND_URL;
}

export function buildRegistrationSmsMessage({
  phone,
  password,
  role,
}: {
  phone: string;
  password: string;
  role: string;
}) {
  const siteUrl = registrationSiteUrl(role).replace(/\/+$/, "");
  return [
    `Tanii ner deer burtgel uuslee uname: ${phone} pass: ${password}`,
    `${siteUrl} urlaar orj code oo solino uu`,
  ].join("\n");
}

export async function sendRegistrationSms({
  phone,
  password,
  role,
}: {
  phone: string;
  password: string;
  role: string;
}) {
  const result = await messageSendToNumber({
    phoneNumber: phone,
    message: buildRegistrationSmsMessage({ phone, password, role }),
  });

  if (
    typeof result === "string" &&
    /failed|error|not configured/i.test(result)
  ) {
    console.error(`Registration SMS was not delivered to ${phone}: ${result}`);
  }

  return result;
}

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

export async function ensurePatientAccountByPhone(patientInput: any, password?: string) {
  const phone = normalizePhone(patientInput?.phone);
  if (!phone) throw new UserInputError("Өвчтөний утасны дугаар олдсонгүй");

  let user = patientInput?.userId ? await User.findById(patientInput.userId) : null;
  if (!user) user = await User.findOne({ phone });
  const generatedPassword = password || generateInitialPassword();
  let shouldSendRegistrationSms = false;

  const userPayload: any = {
    phone,
    firstname: patientInput.firstname || "Patient",
    lastname: patientInput.lastname || "Self Registered",
    role: "patient",
    status: "active",
    password: encryptPassword(generatedPassword),
  };
  if (patientInput.email) userPayload.email = patientInput.email;

  if (!user) {
    user = await User.create(userPayload);
    shouldSendRegistrationSms = true;
  } else {
    user.phone = phone;
    user.firstname = user.firstname || userPayload.firstname;
    user.lastname = user.lastname || userPayload.lastname;
    if (patientInput.email && !user.email) user.email = patientInput.email;
    if (password || !user.password) {
      user.password = userPayload.password;
      shouldSendRegistrationSms = true;
    }
    await user.save();
  }

  if (!patientInput.userId || patientInput.userId.toString() !== user._id!.toString()) {
    patientInput.userId = user._id;
    await patientInput.save();
  }

  if (shouldSendRegistrationSms) {
    await sendRegistrationSms({
      phone,
      password: generatedPassword,
      role: "patient",
    });
  }

  return user;
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

  const emailRegex = new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i");
  const existingUser = await User.findOne({ email: emailRegex });
  if (existingUser?.status === "suspended") {
    throw new UserInputError("Бүртгэл түр хаагдсан байна");
  }

  if (existingUser && existingUser.role !== "patient") {
    throw new UserInputError("Энэ имэйл patient порталд тохирохгүй байна");
  }

  const otp = generateOtp(4);
  emailOtpStore.set(normalizedEmail, {
    code: otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  await sendEmailOtp({ to: normalizedEmail, otp });
  return "OTP кодыг имэйл рүү илгээх хүсэлтийг хүлээн авлаа";
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

  const { user } = await ensurePatientAccountByEmail(normalizedEmail);

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

  setAuthCookie(ctx.res, token);

  return { user };
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
