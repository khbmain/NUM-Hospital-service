import { Appointment } from "../models/appointmentModel";
import { Visit } from "../models/visitModel";
import { ContextType } from "../graphql/context";
import { requireRole } from "../utils/auth";

function getMonthBounds(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(year, monthIndex - 1, 1);
  const end = new Date(year, monthIndex, 1);
  return { start, end };
}

function ageGroup(birthdate?: Date) {
  if (!birthdate) return "unknown";
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const beforeBirthday =
    now.getMonth() < birthdate.getMonth() ||
    (now.getMonth() === birthdate.getMonth() && now.getDate() < birthdate.getDate());
  if (beforeBirthday) age -= 1;
  if (age <= 5) return "0-5";
  if (age <= 17) return "6-17";
  if (age <= 35) return "18-35";
  if (age <= 59) return "36-59";
  return "60+";
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] || 0) + 1;
}

export async function monthlyReport(_: any, { month }: { month: string }, ctx: ContextType) {
  requireRole("doctor", "superadmin")(ctx);
  const { start, end } = getMonthBounds(month);

  const appointments: any[] = await Appointment.find({
    scheduledDate: { $gte: start, $lt: end },
    status: "completed",
  }).populate("patientId serviceId resourceId doctorId assignedStaffId");

  const visits: any[] = await Visit.find({
    visitDate: { $gte: start, $lt: end },
    status: "completed",
  }).populate([
    { path: "patientId" },
    { path: "doctorId", populate: { path: "userId" } },
  ]);

  const byAgeGroup: Record<string, number> = {};
  const byGender: Record<string, number> = {};
  const byService: Record<string, number> = {};
  const byResource: Record<string, number> = {};
  const byDoctor: Record<string, number> = {};

  for (const appointment of appointments) {
    const patient = appointment.patientId;
    increment(byAgeGroup, ageGroup(patient?.birthdate));
    increment(byGender, patient?.gender || "unknown");
    increment(byService, appointment.serviceId?.name || appointment.appointmentKind || "Цаг захиалга");
    increment(byResource, appointment.resourceId?.name || "Тодорхойгүй");
  }

  for (const visit of visits) {
    const patient = visit.patientId;
    increment(byAgeGroup, ageGroup(patient?.birthdate));
    increment(byGender, patient?.gender || "unknown");
    const doctorUser = visit.doctorId?.userId;
    increment(byDoctor, doctorUser?.firstname || visit.doctorId?.specialization || "Эмч");
  }

  const toRows = (input: Record<string, number>) =>
    Object.entries(input).map(([label, count]) => ({ label, count }));

  return {
    month,
    completedAppointments: appointments.length,
    completedVisits: visits.length,
    byAgeGroup: toRows(byAgeGroup),
    byGender: toRows(byGender),
    byService: toRows(byService),
    byResource: toRows(byResource),
    byDoctor: toRows(byDoctor),
  };
}
