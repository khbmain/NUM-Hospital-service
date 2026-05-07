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

const AGE_GROUPS = [
  "0-14",
  "15-19",
  "20-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-49",
  "50-54",
  "55-59",
  "60-64",
  "65+",
];

function ageFromBirthdate(birthdate?: Date) {
  if (!birthdate) return null;
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const beforeBirthday =
    now.getMonth() < birthdate.getMonth() ||
    (now.getMonth() === birthdate.getMonth() && now.getDate() < birthdate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function ageGroup(birthdate?: Date) {
  const age = ageFromBirthdate(birthdate);
  if (age === null) return "unknown";
  if (age <= 14) return "0-14";
  if (age <= 19) return "15-19";
  if (age <= 24) return "20-24";
  if (age <= 29) return "25-29";
  if (age <= 34) return "30-34";
  if (age <= 39) return "35-39";
  if (age <= 44) return "40-44";
  if (age <= 49) return "45-49";
  if (age <= 54) return "50-54";
  if (age <= 59) return "55-59";
  if (age <= 64) return "60-64";
  return "65+";
}

function normalizeGender(gender?: string) {
  if (gender === "female") return "female";
  if (gender === "male") return "male";
  return "unknown";
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
  const matrix: Record<string, Record<string, { female: number; male: number }>> = {};

  const incrementMatrix = (label: string, patient: any) => {
    const group = ageGroup(patient?.birthdate);
    const gender = normalizeGender(patient?.gender);
    if (!AGE_GROUPS.includes(group) || (gender !== "female" && gender !== "male")) return;
    matrix[label] ||= {};
    matrix[label][group] ||= { female: 0, male: 0 };
    matrix[label][group][gender] += 1;
  };

  for (const appointment of appointments) {
    const patient = appointment.patientId;
    const label = appointment.serviceId?.name || appointment.appointmentKind || "Цаг захиалга";
    increment(byAgeGroup, ageGroup(patient?.birthdate));
    increment(byGender, patient?.gender || "unknown");
    increment(byService, label);
    increment(byResource, appointment.resourceId?.name || "Тодорхойгүй");
    incrementMatrix(label, patient);
  }

  for (const visit of visits) {
    const patient = visit.patientId;
    const label = visit.visitType === "walk_in" ? "Шууд үзлэг" : "Эмчийн үзлэг";
    increment(byAgeGroup, ageGroup(patient?.birthdate));
    increment(byGender, patient?.gender || "unknown");
    const doctorUser = visit.doctorId?.userId;
    increment(byDoctor, doctorUser?.firstname || visit.doctorId?.specialization || "Эмч");
    incrementMatrix(label, patient);
  }

  const toRows = (input: Record<string, number>) =>
    Object.entries(input).map(([label, count]) => ({ label, count }));

  return {
    month,
    completedAppointments: appointments.length,
    completedVisits: visits.length,
    ageGroups: AGE_GROUPS,
    ageGenderRows: Object.entries(matrix).map(([label, values]) => {
      let totalFemale = 0;
      let totalMale = 0;
      const cells = AGE_GROUPS.map((group) => {
        const cell = values[group] || { female: 0, male: 0 };
        totalFemale += cell.female;
        totalMale += cell.male;
        return { ageGroup: group, female: cell.female, male: cell.male };
      });
      return { label, cells, totalFemale, totalMale, total: totalFemale + totalMale };
    }),
    byAgeGroup: toRows(byAgeGroup),
    byGender: toRows(byGender),
    byService: toRows(byService),
    byResource: toRows(byResource),
    byDoctor: toRows(byDoctor),
  };
}
