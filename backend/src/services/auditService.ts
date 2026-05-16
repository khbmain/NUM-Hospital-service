import { AuditLog } from "../models/auditLogModel";
import { ContextType } from "../graphql/context";
import { requireRole } from "../utils/auth";

export async function listAuditLogs(
  _: any,
  { filter = {} }: { filter?: { action?: string; resource?: string; userId?: string; page?: number; limit?: number } },
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);

  const query: any = {};
  if (filter.action) query.action = filter.action;
  if (filter.resource) query.resource = new RegExp(filter.resource.trim(), "i");
  if (filter.userId) query.userId = filter.userId;

  const page = filter.page || 1;
  const limit = Math.min(filter.limit || 30, 100);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total, page, limit };
}

export async function logAudit({
  userId,
  action,
  resource,
  resourceId,
  details,
  ctx,
}: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ctx?: ContextType;
}) {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: ctx?.req?.ip || ctx?.req?.socket?.remoteAddress,
      userAgent: ctx?.req?.headers?.["user-agent"],
    });
  } catch (err) {
    // Audit logging should never break the main flow
    console.error("Audit log error:", err);
  }
}
