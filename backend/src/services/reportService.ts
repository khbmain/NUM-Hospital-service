import { Appointment } from "../models/appointmentModel";
import { Visit } from "../models/visitModel";
import { Staff } from "../models/staffModel";
import { ContextType } from "../graphql/context";
import { requireRole } from "../utils/auth";
import { UserInputError } from "apollo-server-errors";

function getMonthBounds(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(year, monthIndex - 1, 1);
  const end = new Date(year, monthIndex, 1);
  return { start, end };
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function nextDay(date: Date) {
  const value = startOfDay(date);
  value.setDate(value.getDate() + 1);
  return value;
}

function getReportBounds({ month, dateFrom, dateTo }: { month?: string; dateFrom?: Date; dateTo?: Date }) {
  if (dateFrom || dateTo) {
    if (!dateFrom || !dateTo) throw new Error("dateFrom болон dateTo хоёуланг оруулна уу");
    const start = startOfDay(dateFrom);
    const end = nextDay(dateTo);
    if (start >= end) throw new Error("Эхлэх огноо дуусах огнооноос өмнө байх ёстой");
    return { start, end };
  }

  return getMonthBounds(month || new Date().toISOString().slice(0, 7));
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

export async function monthlyReport(
  _: any,
  { month, dateFrom, dateTo }: { month?: string; dateFrom?: Date; dateTo?: Date },
  ctx: ContextType,
) {
  requireRole("doctor", "superadmin")(ctx);
  const { start, end } = getReportBounds({ month, dateFrom, dateTo });

  const appointmentQuery: any = {
    scheduledDate: { $gte: start, $lt: end },
    status: "completed",
  };
  const visitQuery: any = {
    visitDate: { $gte: start, $lt: end },
    status: "completed",
  };

  if (ctx.role === "doctor") {
    const staff = await Staff.findOne({ userId: ctx._id }).select("_id");
    if (!staff) throw new UserInputError("Эмчийн ажилтны бүртгэл олдсонгүй");

    appointmentQuery.$or = [
      { doctorId: staff._id },
      { assignedStaffId: staff._id },
      { nurseId: staff._id },
    ];
    visitQuery.doctorId = staff._id;
  }

  const appointments: any[] = await Appointment.find(appointmentQuery)
    .populate("patientId serviceId resourceId doctorId assignedStaffId");

  const visits: any[] = await Visit.find(visitQuery).populate([
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
    month: month || `${start.toISOString().slice(0, 10)} - ${new Date(end.getTime() - 1).toISOString().slice(0, 10)}`,
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
