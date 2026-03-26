import nodemailer from "nodemailer";
import { MESSAGE_API, NODEMAILER } from "./constants";

export function generateOtp(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

export function generateRegistrationNumber(): string {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NUM-${dateStr}-${rand}`;
}

export function generateOrderNumber(prefix: string): string {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${dateStr}-${rand}`;
}

export async function messageSendToNumber({
  phoneNumber,
  message,
}: {
  phoneNumber: string;
  message: string;
}) {
  const API = MESSAGE_API as string | undefined;
  if (!API) {
    console.warn("MESSAGE_API is not defined, skipping SMS");
    return "SMS API not configured";
  }

  const readySendMessage = `${API}&sendto=${phoneNumber}&message=${message}`;

  try {
    const response = await fetch(readySendMessage, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error("Failed to send message:", errorResponse);
      return "Message sending failed: " + errorResponse;
    }

    return (await response.text()) || "Message successfully sent";
  } catch (error) {
    console.error("Error sending message:", error);
    return "Error sending message: " + error;
  }
}

export async function sendEmailOtp({
  to,
  otp,
}: {
  to: string;
  otp: string;
}) {
  if (!NODEMAILER.user || !NODEMAILER.pass) {
    console.warn(`Email credentials are not configured. OTP for ${to}: ${otp}`);
    return "Email not configured";
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: NODEMAILER.user,
      pass: NODEMAILER.pass,
    },
  });

  await transporter.sendMail({
    from: NODEMAILER.user,
    to,
    subject: "NUM Hospital нэвтрэх OTP код",
    text: `Таны нэвтрэх OTP код: ${otp}. Код 5 минутын хугацаанд хүчинтэй.`,
  });

  return "Email sent";
}
