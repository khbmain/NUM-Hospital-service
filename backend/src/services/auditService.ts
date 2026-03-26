import { AuditLog } from "../models/auditLogModel";
import { ContextType } from "../graphql/context";

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
