import { UserInputError } from "apollo-server-errors";
import { DateTime } from "luxon";
import { Appointment } from "../models/appointmentModel";
import { Resource } from "../models/resourceModel";
import { Service } from "../models/serviceModel";
import { Staff } from "../models/staffModel";
import { UnavailableBlock } from "../models/unavailableBlockModel";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";
import { logAudit } from "./auditService";
import { createNotification } from "./notificationService";
import { sendEmail } from "../utils/helper";

const ACTIVE_APPOINTMENT_STATUSES = { $nin: ["cancelled", "no_show"] };
const HOSPITAL_TIME_ZONE = process.env.HOSPITAL_TIME_ZONE || "Asia/Ulaanbaatar";
const LUNCH_START_TIME = process.env.LUNCH_START_TIME || "12:00";
const LUNCH_END_TIME = process.env.LUNCH_END_TIME || "13:00";
const SCHEDULE_ADMIN_ROLES = ["superadmin"];

function canManageAnySchedule(ctx: ContextType) {
  return SCHEDULE_ADMIN_ROLES.includes(ctx.role);
}

async function getCurrentStaffOrThrow(ctx: ContextType) {
  const staff = await Staff.findOne({ userId: ctx._id });
  if (!staff) throw new UserInputError("Таны ажилтны бүртгэл олдсонгүй");
  return staff;
}

async function assertOwnScheduleBlock(block: any, ctx: ContextType) {
  if (canManageAnySchedule(ctx)) return;
  const staff: any = await getCurrentStaffOrThrow(ctx);
  if (block.staffId?.toString() !== staff._id.toString() || block.createdBy?.toString() !== ctx._id) {
    throw new UserInputError("Зөвхөн өөрийн үүсгэсэн хаалтыг өөрчлөх боломжтой");
  }
}

function parseTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return DateTime.fromJSDate(new Date(date), { zone: HOSPITAL_TIME_ZONE })
    .set({ hour: hours || 0, minute: minutes || 0, second: 0, millisecond: 0 })
    .toJSDate();
}

function formatTime(date: Date) {
  return DateTime.fromJSDate(date, { zone: HOSPITAL_TIME_ZONE }).toFormat("HH:mm");
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function getHospitalDayBounds(date: Date) {
  const hospitalDate = DateTime.fromJSDate(new Date(date), { zone: HOSPITAL_TIME_ZONE });
  return {
    dayStart: hospitalDate.startOf("day").toJSDate(),
    dayEnd: hospitalDate.endOf("day").toJSDate(),
  };
}

function getHospitalDayOfWeek(date: Date) {
  const weekday = DateTime.fromJSDate(new Date(date), { zone: HOSPITAL_TIME_ZONE }).weekday;
  return weekday === 7 ? 0 : weekday;
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function overlapsLunch(date: Date, start: Date, end: Date) {
  if (!LUNCH_START_TIME || !LUNCH_END_TIME) return false;
  const lunchStart = parseTime(date, LUNCH_START_TIME);
  const lunchEnd = parseTime(date, LUNCH_END_TIME);
  return overlaps(start, end, lunchStart, lunchEnd);
}

async function resolveResourceForDoctor(doctorId: string, serviceId?: string) {
  let resource = await Resource.findOne({ staffId: doctorId, type: "doctor", isActive: true });
  if (!resource) {
    const doctor = await Staff.findById(doctorId).populate("userId");
    if (!doctor) throw new UserInputError("Эмч олдсонгүй");
    const user: any = doctor.userId;
    resource = await new Resource({
      name: `${user?.lastname ? `${user.lastname.charAt(0)}.` : ""}${user?.firstname || "Эмч"}`,
      type: "doctor",
      staffId: doctor._id,
      serviceIds: serviceId ? [serviceId] : [],
      capacity: 1,
      slotIntervalMinutes: 20,
      workSchedule: doctor.workSchedule?.length
        ? doctor.workSchedule
        : [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
      isActive: true,
    }).save();
  }
  return resource;
}

async function getServiceOrDefault(serviceId?: string) {
  if (!serviceId) return null;
  const service = await Service.findById(serviceId);
  if (!service) throw new UserInputError("Үйлчилгээ олдсонгүй");
  return service;
}

function validateServiceOwner(input: any) {
  const ownerFlags = [input?.requiresDoctor, input?.requiresNurse, input?.requiresDevice].filter(Boolean);
  if (ownerFlags.length !== 1) {
    throw new UserInputError("Үйлчилгээг эмч, сувилагч, эсвэл төхөөрөмжийн аль нэгэнд заавал хамааруулна.");
  }
}

async function validateAssignedStaff(input: any) {
  if (!Array.isArray(input?.assignedStaffIds) || input.assignedStaffIds.length === 0) {
    throw new UserInputError("Үйлчилгээнд дор хаяж нэг ажилтан заавал онооно.");
  }

  const staff = await Staff.find({ _id: { $in: input.assignedStaffIds } }).select("_id staffType");
  if (staff.length !== input.assignedStaffIds.length) {
    throw new UserInputError("Оноосон ажилтны мэдээлэл олдсонгүй.");
  }

  const requiredStaffType = input.requiresDoctor ? "doctor" : input.requiresNurse ? "nurse" : null;
  if (requiredStaffType && staff.some((item) => item.staffType !== requiredStaffType)) {
    throw new UserInputError(
      requiredStaffType === "doctor"
        ? "Эмчийн үйлчилгээнд зөвхөн эмч онооно."
        : "Сувилагчийн үйлчилгээнд зөвхөн сувилагч онооно."
    );
  }
}

export async function listServices(_: any, { category }: { category?: string }, ctx: ContextType) {
  requireAuth(ctx);
  const query: any = { isActive: true };
  if (category) query.category = category;
  return Service.find(query).sort({ category: 1, name: 1 });
}

export async function listResources(
  _: any,
  { serviceId, type }: { serviceId?: string; type?: string },
  ctx: ContextType
) {
  requireAuth(ctx);
  const query: any = { isActive: true };
  if (serviceId) query.serviceIds = serviceId;
  if (type) query.type = type;
  return Resource.find(query).populate("serviceIds staffId").sort({ type: 1, name: 1 });
}

export async function createService(_: any, { input }: { input: any }, ctx: ContextType) {
  requireRole("superadmin")(ctx);
  validateServiceOwner(input);
  await validateAssignedStaff(input);

  const normalizedInput = {
    ...input,
    code: String(input.code || "").trim().toUpperCase(),
    name: String(input.name || "").trim(),
  };
  const existing = await Service.findOne({ code: normalizedInput.code });
  if (existing) throw new UserInputError("Ийм code-той үйлчилгээ аль хэдийн бүртгэгдсэн байна.");

  const service = await new Service(normalizedInput).save();
  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "service",
    resourceId: service._id!.toString(),
    ctx,
  });
  return service;
}

export async function updateService(_: any, { _id, input }: { _id: string; input: any }, ctx: ContextType) {
  requireRole("superadmin")(ctx);
  const existing = await Service.findById(_id);
  if (!existing) throw new UserInputError("Үйлчилгээ олдсонгүй");
  validateServiceOwner({
    requiresDoctor: input?.requiresDoctor ?? existing.requiresDoctor,
    requiresNurse: input?.requiresNurse ?? existing.requiresNurse,
    requiresDevice: input?.requiresDevice ?? existing.requiresDevice,
  });
  await validateAssignedStaff({
    assignedStaffIds: input?.assignedStaffIds ?? existing.assignedStaffIds,
    requiresDoctor: input?.requiresDoctor ?? existing.requiresDoctor,
    requiresNurse: input?.requiresNurse ?? existing.requiresNurse,
    requiresDevice: input?.requiresDevice ?? existing.requiresDevice,
  });
  const service = await Service.findByIdAndUpdate(_id, input, { new: true });
  if (!service) throw new UserInputError("Үйлчилгээ олдсонгүй");
  return service;
}

export async function createResource(_: any, { input }: { input: any }, ctx: ContextType) {
  requireRole("superadmin")(ctx);
  const resource = await new Resource(input).save();
  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "resource",
    resourceId: resource._id!.toString(),
    ctx,
  });
  return resource.populate("serviceIds staffId");
}

export async function updateResource(_: any, { _id, input }: { _id: string; input: any }, ctx: ContextType) {
  requireRole("superadmin")(ctx);
  const resource = await Resource.findByIdAndUpdate(_id, input, { new: true }).populate("serviceIds staffId");
  if (!resource) throw new UserInputError("Нөөц олдсонгүй");
  return resource;
}

export async function listUnavailableBlocks(
  _: any,
  { dateFrom, dateTo, resourceId, staffId }: { dateFrom?: Date; dateTo?: Date; resourceId?: string; staffId?: string },
  ctx: ContextType
) {
  requireRole("doctor", "nurse", "superadmin")(ctx);
  const query: any = {};
  if (canManageAnySchedule(ctx)) {
    if (resourceId) query.resourceId = resourceId;
    if (staffId) query.staffId = staffId;
  } else {
    const staff: any = await getCurrentStaffOrThrow(ctx);
    query.staffId = staff._id;
  }
  if (dateFrom || dateTo) {
    if (dateTo) query.startAt = { $lt: new Date(dateTo) };
    if (dateFrom) query.endAt = { $gt: new Date(dateFrom) };
  }
  query.status = { $ne: "cancelled" };
  return UnavailableBlock.find(query)
    .populate([
      "serviceId", "resourceId", "staffId", "createdBy",
      { path: "cancelledAppointmentIds", populate: { path: "patientId" } },
    ])
    .sort({ startAt: -1 });
}

export async function createUnavailableBlock(_: any, { input }: { input: any }, ctx: ContextType) {
  requireRole("doctor", "nurse", "superadmin")(ctx);

  const blockInput = { ...input };
  if (!canManageAnySchedule(ctx)) {
    const staff: any = await getCurrentStaffOrThrow(ctx);
    if ((blockInput.staffId && blockInput.staffId !== staff._id.toString()) || blockInput.resourceId) {
      throw new UserInputError("Та зөвхөн өөрийн цагийг хаах боломжтой");
    }
    blockInput.staffId = staff._id;
    delete blockInput.resourceId;
  }

  const startAt = new Date(blockInput.startAt);
  const endAt = new Date(blockInput.endAt);
  if (!(startAt < endAt)) throw new UserInputError("Дуусах цаг эхлэх цагаас хойш байх ёстой");
  if (!blockInput.resourceId && !blockInput.staffId) throw new UserInputError("Нөөц эсвэл ажилтан сонгоно уу");

  const andConditions: any[] = [
    { scheduledStart: { $lt: endAt } },
    { $or: [{ blockedUntil: { $gt: startAt } }, { blockedUntil: null }] },
  ];
  if (blockInput.staffId) {
    andConditions.push({ $or: [
      { doctorId: blockInput.staffId },
      { nurseId: blockInput.staffId },
      { assignedStaffId: blockInput.staffId },
    ]});
  }
  const appointmentQuery: any = {
    status: { $in: ["scheduled", "checked_in"] },
    $and: andConditions,
  };
  if (blockInput.resourceId) appointmentQuery.resourceId = blockInput.resourceId;

  const affectedAppointments: any[] = await Appointment.find(appointmentQuery)
    .populate("patientId serviceId resourceId doctorId assignedStaffId");

  const block = await new UnavailableBlock({
    ...blockInput,
    status: "active",
    startAt,
    endAt,
    cancelledAppointmentIds: affectedAppointments.map((appointment) => appointment._id),
    createdBy: ctx._id,
  }).save();

  const reason = blockInput.reason || "Үйлчилгээ түр боломжгүй болсон";
  await Promise.all(affectedAppointments.map(async (appointment) => {
    appointment.status = "cancelled";
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = ctx._id as any;
    appointment.cancelReason = reason;
    await appointment.save();

    const patient: any = appointment.patientId;
    const service: any = appointment.serviceId;
    const resource: any = appointment.resourceId;
    const subject = "NUM Hospital: Таны цаг цуцлагдлаа";
    const dateLabel = appointment.scheduledStart
      ? new Date(appointment.scheduledStart).toLocaleString("mn-MN")
      : `${new Date(appointment.scheduledDate).toLocaleDateString("mn-MN")} ${appointment.scheduledTime}`;
    const message = [
      `Сайн байна уу, ${patient?.lastname ? `${patient.lastname} ` : ""}${patient?.firstname || ""}.`,
      `Таны ${dateLabel}-д захиалсан ${service?.name || "үйлчилгээ"} цаг цуцлагдлаа.`,
      resource?.name ? `Нөөц/төхөөрөмж: ${resource.name}.` : "",
      `Шалтгаан: ${reason}.`,
      "Дахин цаг захиална уу эсвэл админтай холбогдоно уу.",
    ].filter(Boolean).join("\n");

    if (patient?.userId) {
      await createNotification({
        userId: patient.userId.toString(),
        title: "Таны цаг цуцлагдлаа",
        body: { appointmentId: appointment._id, reason, scheduledAt: dateLabel },
        type: "appointment",
      });
    }

    if (patient?.email) {
      await sendEmail({ to: patient.email, subject, text: message });
    }
  }));

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "unavailable_block",
    resourceId: block._id!.toString(),
    details: { affectedAppointments: affectedAppointments.length, reason },
    ctx,
  });

  return block.populate([
    "serviceId", "resourceId", "staffId", "createdBy",
    { path: "cancelledAppointmentIds", populate: { path: "patientId" } },
  ]);
}

export async function updateUnavailableBlock(_: any, { _id, input }: { _id: string; input: any }, ctx: ContextType) {
  requireRole("doctor", "nurse", "superadmin")(ctx);
  const block = await UnavailableBlock.findById(_id);
  if (!block) throw new UserInputError("Хаасан хугацаа олдсонгүй");
  if (block.status === "cancelled") throw new UserInputError("Цуцлагдсан хаалтыг засах боломжгүй");
  await assertOwnScheduleBlock(block, ctx);

  if (input.startAt) block.startAt = new Date(input.startAt) as any;
  if (input.endAt) block.endAt = new Date(input.endAt) as any;
  if (!(block.startAt < block.endAt)) throw new UserInputError("Дуусах цаг эхлэх цагаас хойш байх ёстой");
  if (input.reason !== undefined) block.reason = input.reason;
  if (input.note !== undefined) block.note = input.note;
  await block.save();

  await logAudit({
    userId: ctx._id,
    action: "update",
    resource: "unavailable_block",
    resourceId: _id,
    ctx,
  });

  return block.populate("serviceId resourceId staffId createdBy cancelledBy cancelledAppointmentIds");
}

export async function cancelUnavailableBlock(_: any, { _id }: { _id: string }, ctx: ContextType) {
  requireRole("doctor", "nurse", "superadmin")(ctx);
  const block = await UnavailableBlock.findById(_id);
  if (!block) throw new UserInputError("Хаасан хугацаа олдсонгүй");
  await assertOwnScheduleBlock(block, ctx);
  block.status = "cancelled";
  block.cancelledAt = new Date();
  block.cancelledBy = ctx._id as any;
  await block.save();

  await logAudit({
    userId: ctx._id,
    action: "cancel",
    resource: "unavailable_block",
    resourceId: _id,
    ctx,
  });

  return block.populate("serviceId resourceId staffId createdBy cancelledBy cancelledAppointmentIds");
}

export async function seedDefaultScheduling(_: any, __: any, ctx: ContextType) {
  requireRole("superadmin")(ctx);

  const defaults = [
    { code: "DOCTOR_CONSULT", name: "Эмчийн үзлэг", category: "consultation", defaultDurationMinutes: 20, requiresDoctor: true },
    { code: "NURSE_INJECTION", name: "Сувилагчийн тариа", category: "injection", defaultDurationMinutes: 15, requiresNurse: true },
    { code: "IV_INFUSION", name: "Дусал", category: "infusion", defaultDurationMinutes: 90, requiresNurse: true },
    { code: "IV_ACCESS", name: "Гар судас тариа", category: "procedure", defaultDurationMinutes: 20, requiresNurse: true },
    { code: "IRRADIATION", name: "Шарлага", category: "device", defaultDurationMinutes: 20, defaultBufferMinutes: 10, requiresDevice: true },
    { code: "MASSAGE_CHAIR", name: "Массажны сандал", category: "device", defaultDurationMinutes: 30, defaultBufferMinutes: 10, requiresDevice: true },
  ];

  const services = [];
  for (const item of defaults) {
    services.push(
      await Service.findOneAndUpdate({ code: item.code }, item, { upsert: true, new: true, setDefaultsOnInsert: true })
    );
  }

  const infusion = services.find((service: any) => service.code === "IV_INFUSION");
  if (infusion) {
    await Resource.findOneAndUpdate(
      { name: "Дуслын өрөө" },
      {
        name: "Дуслын өрөө",
        type: "capacity_room",
        category: "infusion",
        serviceIds: [infusion._id],
        capacity: 8,
        slotIntervalMinutes: 30,
        defaultDurationMinutes: 90,
        defaultBufferMinutes: 0,
        workSchedule: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const irradiation = services.find((service: any) => service.code === "IRRADIATION");
  const massage = services.find((service: any) => service.code === "MASSAGE_CHAIR");
  const deviceTemplates = [
    { service: irradiation, name: "Шарлагын төхөөрөмж 1", category: "irradiation", duration: 20, buffer: 10 },
    { service: massage, name: "Массажны сандал 1", category: "massage_chair", duration: 30, buffer: 10 },
  ];
  for (const item of deviceTemplates) {
    if (!item.service) continue;
    await Resource.findOneAndUpdate(
      { name: item.name },
      {
        name: item.name,
        type: "device",
        category: item.category,
        serviceIds: [item.service._id],
        capacity: 1,
        slotIntervalMinutes: item.duration + item.buffer,
        defaultDurationMinutes: item.duration,
        defaultBufferMinutes: item.buffer,
        workSchedule: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return true;
}

export async function getAvailableSlots(
  _: any,
  { doctorId, serviceId, resourceId, date }: { doctorId?: string; serviceId?: string; resourceId?: string; date: Date },
  ctx: ContextType
) {
  requireAuth(ctx);

  const service: any = await getServiceOrDefault(serviceId);
  const resource: any = resourceId
    ? await Resource.findById(resourceId)
    : doctorId
      ? await resolveResourceForDoctor(doctorId, serviceId)
      : null;

  if (!resource) throw new UserInputError("Цагийн нөөц сонгоно уу");

  const duration = resource.defaultDurationMinutes || service?.defaultDurationMinutes || 30;
  const buffer = resource.defaultBufferMinutes ?? service?.defaultBufferMinutes ?? 0;
  const interval = resource.slotIntervalMinutes || duration + buffer || 30;
  const capacity = resource.capacity || 1;

  const schedule = resource.workSchedule?.find((item: any) => item.dayOfWeek === getHospitalDayOfWeek(new Date(date)))
    || { startTime: "09:00", endTime: "17:00" };
  const startOfWork = parseTime(new Date(date), schedule.startTime || "09:00");
  const endOfWork = parseTime(new Date(date), schedule.endTime || "17:00");
  const now = new Date();
  const { dayStart, dayEnd } = getHospitalDayBounds(new Date(date));

  const existing: any[] = await Appointment.find({
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: ACTIVE_APPOINTMENT_STATUSES,
    $or: [
      { resourceId: resource._id },
      ...(resource.staffId ? [{ doctorId: resource.staffId, resourceId: null }] : []),
    ],
  });
  const blocks: any[] = await UnavailableBlock.find({
    $or: [
      ...(resource?._id ? [{ resourceId: resource._id }] : []),
      ...(resource?.staffId ? [{ staffId: resource.staffId }] : []),
    ],
    status: { $ne: "cancelled" },
    startAt: { $lt: endOfWork },
    endAt: { $gt: startOfWork },
  });

  const slots = [];
  for (let cursor = startOfWork; addMinutes(cursor, duration + buffer) <= endOfWork; cursor = addMinutes(cursor, interval)) {
    const slotEnd = addMinutes(cursor, duration);
    const blockedUntil = addMinutes(slotEnd, buffer);
    const past = cursor <= now;
    const lunch = overlapsLunch(new Date(date), cursor, blockedUntil);
    const adminBlock = blocks.find((block) => overlaps(block.startAt, block.endAt, cursor, blockedUntil));
    const overlapCount = existing.filter((appointment) => {
      const existingStart = appointment.scheduledStart || parseTime(appointment.scheduledDate, appointment.scheduledTime);
      const existingBlockedUntil = appointment.blockedUntil
        || addMinutes(existingStart, (appointment.durationMinutes || appointment.duration || 30) + (appointment.bufferMinutes || 0));
      return overlaps(existingStart, existingBlockedUntil, cursor, blockedUntil);
    }).length;

    let status = "available";
    let reason = "";
    if (adminBlock) {
      status = "blocked";
      reason = adminBlock.reason || "Цаг хаасан";
    } else if (overlapCount >= capacity) {
      status = "booked";
      reason = "Захиалгатай";
    } else if (past) {
      status = "past";
      reason = "Өнгөрсөн цаг";
    } else if (lunch) {
      status = "blocked";
      reason = "Цайны цаг";
    }

    slots.push({
      time: formatTime(cursor),
      available: status === "available",
      status,
      reason: reason || null,
      remaining: Math.max(capacity - overlapCount, 0),
      capacity,
      startsAt: cursor,
      endsAt: slotEnd,
    });
  }

  return slots;
}

export async function buildAppointmentTiming(input: any) {
  const service: any = await getServiceOrDefault(input.serviceId);
  let resource: any = input.resourceId ? await Resource.findById(input.resourceId) : null;
  if (!resource && input.doctorId) {
    resource = await resolveResourceForDoctor(input.doctorId, input.serviceId);
  }

  const scheduledDate = new Date(input.scheduledDate);
  const scheduledStart = parseTime(scheduledDate, input.scheduledTime);
  const durationMinutes = input.durationMinutes || input.duration || resource?.defaultDurationMinutes || service?.defaultDurationMinutes || 30;
  const bufferMinutes = input.bufferMinutes ?? resource?.defaultBufferMinutes ?? service?.defaultBufferMinutes ?? 0;
  const scheduledEnd = addMinutes(scheduledStart, durationMinutes);
  const blockedUntil = addMinutes(scheduledEnd, bufferMinutes);
  return { service, resource, scheduledDate, scheduledStart, scheduledEnd, blockedUntil, durationMinutes, bufferMinutes };
}

export async function assertResourceAvailability(input: any) {
  const timing = await buildAppointmentTiming(input);
  const { resource, scheduledDate, scheduledStart, blockedUntil } = timing;
  if (!resource) return timing;
  if (overlapsLunch(scheduledDate, scheduledStart, blockedUntil)) {
    throw new UserInputError("Цайны цагт цаг авах боломжгүй");
  }
  if (scheduledStart <= new Date()) {
    throw new UserInputError("Өнгөрсөн цаг дээр цаг авах боломжгүй");
  }
  const adminBlock = await UnavailableBlock.findOne({
    $or: [
      { resourceId: resource._id },
      ...(resource.staffId ? [{ staffId: resource.staffId }] : []),
    ],
    status: { $ne: "cancelled" },
    startAt: { $lt: blockedUntil },
    endAt: { $gt: scheduledStart },
  });
  if (adminBlock) {
    throw new UserInputError("Энэ хугацаанд үйлчилгээ авах боломжгүй");
  }

  const { dayStart, dayEnd } = getHospitalDayBounds(scheduledDate);
  const existing: any[] = await Appointment.find({
    resourceId: resource._id,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: ACTIVE_APPOINTMENT_STATUSES,
  });

  const overlapCount = existing.filter((appointment) => {
    const existingStart = appointment.scheduledStart || parseTime(appointment.scheduledDate, appointment.scheduledTime);
    const existingBlockedUntil = appointment.blockedUntil
      || addMinutes(existingStart, (appointment.durationMinutes || appointment.duration || 30) + (appointment.bufferMinutes || 0));
    return overlaps(existingStart, existingBlockedUntil, scheduledStart, blockedUntil);
  }).length;

  if (overlapCount >= (resource.capacity || 1)) {
    throw new UserInputError("Энэ цаг дээр сонгосон нөөц дүүрсэн байна");
  }

  return timing;
}
