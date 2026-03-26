import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import { ContextType } from "../graphql/context";
import { JWT_SECRET, JWT_EXPIRATION, Role } from "./constants";

export type DecodedToken = {
  _id: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
};

// Password helpers
export function authenticate(plainTextPass: string | null, password: string) {
  if (!plainTextPass) return false;
  return bcrypt.compareSync(plainTextPass, password);
}

export const encryptPassword = (password: string) =>
  bcrypt.hashSync(password, 10);

// Token helpers
export const generateToken = (user: {
  _id: string;
  phone: string;
  role: string;
}) => jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRATION as SignOptions["expiresIn"] });

export const decodeToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as DecodedToken;
};

// ─── Access Guards ───────────────────────────────────────────

/**
 * Require authentication — throws if no valid user in context
 */
export function requireAuth(ctx: ContextType) {
  if (!ctx._id || !ctx.authenticated) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

/**
 * Generic role guard — replaces individual guardAccess/sohAccess/adminAccess
 * Usage: requireRole("doctor", "superadmin")(ctx)
 */
export function requireRole(...roles: Role[]) {
  return (ctx: ContextType) => {
    requireAuth(ctx);
    if (!roles.includes(ctx.role as Role)) {
      throw new GraphQLError(
        `Access denied. Required roles: ${roles.join(", ")}`,
        { extensions: { code: "FORBIDDEN" } }
      );
    }
  };
}

/**
 * Require that user is the resource owner OR has one of the specified roles
 */
export function requireOwnerOrRole(
  ctx: ContextType,
  ownerId: string,
  ...roles: Role[]
) {
  requireAuth(ctx);
  if (ctx._id === ownerId) return; // Owner can access
  if (!roles.includes(ctx.role as Role)) {
    throw new GraphQLError("Access denied", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

// Legacy aliases for backward compatibility with boilerplate patterns
export function authenticatedAccess(ctx: ContextType) {
  requireAuth(ctx);
}

export function adminAccess(ctx: ContextType) {
  requireRole("superadmin")(ctx);
}
