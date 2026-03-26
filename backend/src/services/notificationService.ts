import { Notification } from "../models/notificationModel";
import { ContextType } from "../graphql/context";
import { requireAuth } from "../utils/auth";

export async function getMyNotifications(
  _: any,
  { page = 1, limit = 20 }: { page?: number; limit?: number },
  ctx: ContextType
) {
  requireAuth(ctx);
  return Notification.find({ userId: ctx._id })
    .sort({ createdAt: -1, read: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
}

export async function readNotifications(
  _: any,
  { ids }: { ids: string[] },
  ctx: ContextType
) {
  requireAuth(ctx);
  await Notification.updateMany(
    { _id: { $in: ids }, userId: ctx._id },
    { read: true }
  );
  return Notification.find({ _id: { $in: ids } });
}

// Helper: create notification (used by other services)
export async function createNotification({
  userId,
  title,
  body,
  type = "info",
}: {
  userId: string;
  title: string;
  body?: any;
  type?: string;
}) {
  return Notification.create({ userId, title, body, type });
}
