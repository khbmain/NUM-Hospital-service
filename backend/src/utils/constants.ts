import dotenv from "dotenv";
dotenv.config();

// Server
export const PORT = process.env.PORT || 4000;
export const NODE_ENV = process.env.NODE_ENV || "development";

// MongoDB
export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/num_hospital";

// JWT
export const JWT_SECRET = process.env.JWT_SECRET || "secret";
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1d";

// AWS S3
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Email
export const NODEMAILER = {
  user: process.env.EMAIL,
  pass: process.env.EMAIL_PASSWORD,
};

// SMS
export const MESSAGE_API = process.env.MESSAGE_API;

// Firebase
export const firebaseAdminKey = {
  type: process.env.FIREBASE_TYPE || "",
  project_id: process.env.FIREBASE_PROJECT_ID || "",
  private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
  client_id: process.env.FIREBASE_CLIENT_ID || "",
  auth_uri: process.env.FIREBASE_AUTH_URI || "",
  token_uri: process.env.FIREBASE_TOKEN_URI || "",
  auth_provider_x509_cert_url:
    process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || "",
};

// OAuth2 / NUM SISI
export const NUM_SISI_CLIENT_ID = process.env.NUM_SISI_CLIENT_ID || "";
export const NUM_SISI_CLIENT_SECRET = process.env.NUM_SISI_CLIENT_SECRET || "";
export const NUM_SISI_AUTH_URL =
  process.env.NUM_SISI_AUTH_URL ||
  "https://sisi.num.edu.mn/oauth2/authorize";
export const NUM_SISI_TOKEN_URL =
  process.env.NUM_SISI_TOKEN_URL || "https://sisi.num.edu.mn/oauth2/token";
export const NUM_SISI_USERINFO_URL =
  process.env.NUM_SISI_USERINFO_URL ||
  "https://sisi.num.edu.mn/oauth2/userinfo";
export const NUM_SISI_CALLBACK_URL =
  process.env.NUM_SISI_CALLBACK_URL ||
  "http://localhost:4000/auth/sisi/callback";
export const NUM_SISI_SCOPES =
  process.env.NUM_SISI_SCOPES || "openid profile email phone";
export const OAUTH_STATE_SECRET =
  process.env.OAUTH_STATE_SECRET || "oauth-state-secret";

// Frontend URLs
export const PATIENT_FRONTEND_URL =
  process.env.PATIENT_FRONTEND_URL || "http://localhost:3000";
export const ADMIN_FRONTEND_URL =
  process.env.ADMIN_FRONTEND_URL || "http://localhost:3001";

// Hospital enums
export const ROLES = [
  "patient",
  "doctor",
  "nurse",
  "superadmin",
] as const;
export type Role = (typeof ROLES)[number];

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const VISIT_STATUSES = [
  "draft",
  "active",
  "completed",
  "cancelled",
] as const;

export const TREATMENT_STATUSES = [
  "ordered",
  "queued",
  "in_progress",
  "done",
  "skipped",
  "cancelled",
] as const;

export const PATIENT_CATEGORIES = [
  "student",
  "teacher",
  "employee",
  "external",
] as const;

export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "unknown",
] as const;

export const DIAGNOSIS_TYPES = [
  "primary",
  "secondary",
  "differential",
] as const;

export const SEVERITY_LEVELS = [
  "mild",
  "moderate",
  "severe",
  "critical",
] as const;

export const INVENTORY_CATEGORIES = [
  "medicine",
  "material",
  "equipment",
  "consumable",
] as const;
