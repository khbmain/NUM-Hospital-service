import { Staff } from "../models/staffModel";
import { Department } from "../models/departmentModel";
import { ContextType } from "../graphql/context";
import { requireRole } from "../utils/auth";
import { UserInputError } from "apollo-server-errors";
import { logAudit } from "./auditService";

// ─── Staff Queries ───

export async function listStaff(
  _: any,
  { staffType, departmentId }: { staffType?: string; departmentId?: string },
  ctx: ContextType
) {
  requireRole("superadmin", "data_operator", "doctor", "nurse")(ctx);
  const filter: any = {};
  if (staffType) filter.staffType = staffType;
  if (departmentId) filter.departmentId = departmentId;
  return Staff.find(filter).populate("userId departmentId").sort({ createdAt: -1 });
}

export async function getStaff(
  _: any,
  { _id }: { _id: string },
  ctx: ContextType
) {
  requireRole("superadmin", "data_operator")(ctx);
  return Staff.findById(_id).populate("userId departmentId");
}

export async function getDoctors(
  _: any,
  { departmentId }: { departmentId?: string },
  ctx: ContextType
) {
  // Accessible to patients (for booking) and all staff
  const filter: any = { staffType: "doctor", status: "active", isAvailable: true };
  if (departmentId) filter.departmentId = departmentId;
  return Staff.find(filter).populate("userId departmentId");
}

// ─── Staff Mutations ───

export async function createStaff(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);

  const existing = await Staff.findOne({ userId: input.userId });
  if (existing) throw new UserInputError("Энэ хэрэглэгч аль хэдийн ажилтнаар бүртгэгдсэн");

  const staff = new Staff(input);
  await staff.save();

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "staff",
    resourceId: staff._id!.toString(),
    ctx,
  });

  return staff.populate("userId departmentId");
}

export async function updateStaff(
  _: any,
  { _id, input }: { _id: string; input: any },
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);
  const staff = await Staff.findByIdAndUpdate(_id, input, { new: true })
    .populate("userId departmentId");
  if (!staff) throw new UserInputError("Ажилтан олдсонгүй");
  return staff;
}

// ─── Department Queries ───

export async function listDepartments(_: any, __: any, _ctx: ContextType) {
  return Department.find({ isActive: true }).sort({ name: 1 });
}

// ─── Department Mutations ───

export async function createDepartment(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);
  const dept = new Department(input);
  await dept.save();
  return dept;
}

export async function updateDepartment(
  _: any,
  { _id, input }: { _id: string; input: any },
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);
  const dept = await Department.findByIdAndUpdate(_id, input, { new: true });
  if (!dept) throw new UserInputError("Тасаг олдсонгүй");
  return dept;
}
