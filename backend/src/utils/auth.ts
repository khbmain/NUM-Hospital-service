import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
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

export const AUTH_COOKIE_NAME = "num_hospital_token";

const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
};

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...authCookieOptions,
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
}

export function getAuthTokenFromRequest(req: Request) {
  const authorizationToken = req.headers.authorization?.replace("Bearer ", "");
  if (authorizationToken) return authorizationToken;

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const authCookie = cookies.find((cookie) =>
    cookie.startsWith(`${AUTH_COOKIE_NAME}=`)
  );

  return authCookie ? decodeURIComponent(authCookie.split("=")[1] || "") : "";
}

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
