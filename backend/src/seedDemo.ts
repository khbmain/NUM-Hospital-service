// @ts-nocheck
import mongoose from "mongoose";
import { Department } from "./models/departmentModel";
import { User } from "./models/userModel";
import { Staff } from "./models/staffModel";
import { Patient } from "./models/patientModel";
import { Appointment } from "./models/appointmentModel";
import { Visit } from "./models/visitModel";
import { VitalSign } from "./models/vitalSignModel";
import { Diagnosis } from "./models/diagnosisModel";
import { Prescription } from "./models/prescriptionModel";
import { Notification } from "./models/notificationModel";
import { AuditLog } from "./models/auditLogModel";
import { encryptPassword } from "./utils/auth";
import { MONGODB_URI } from "./utils/constants";

function withTime(base: Date, hour: number, minute = 0) {
  const date = new Date(base);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function upsertUser(data: {
  phone: string;
  password: string;
  firstname: string;
  lastname: string;
  role: "superadmin" | "doctor" | "nurse" | "data_operator" | "patient";
  email?: string;
  gender?: "male" | "female" | "other";
}) {
  return User.findOneAndUpdate(
    { phone: data.phone },
    {
      $set: {
        phone: data.phone,
        firstname: data.firstname,
        lastname: data.lastname,
        role: data.role,
        email: data.email,
        gender: data.gender,
        password: encryptPassword(data.password),
        status: "active",
        phoneVerified: true,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertDepartment(code: string, name: string, description: string) {
  return Department.findOneAndUpdate(
    { code },
    { $set: { code, name, description, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertStaff(data: {
  userId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  staffType: "doctor" | "nurse" | "data_operator" | "admin_staff";
  specialization?: string;
  licenseNumber?: string;
  title?: string;
  bio?: string;
  maxDailyAppointments?: number;
}) {
  return Staff.findOneAndUpdate(
    { userId: data.userId },
    {
      $set: {
        ...data,
        isAvailable: true,
        status: "active",
        maxDailyAppointments: data.maxDailyAppointments || 20,
        workSchedule: [
          { dayOfWeek: 1, startTime: "08:30", endTime: "17:30" },
          { dayOfWeek: 2, startTime: "08:30", endTime: "17:30" },
          { dayOfWeek: 3, startTime: "08:30", endTime: "17:30" },
          { dayOfWeek: 4, startTime: "08:30", endTime: "17:30" },
          { dayOfWeek: 5, startTime: "08:30", endTime: "17:30" },
        ],
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertPatient(data: {
  registrationNumber: string;
  firstname: string;
  lastname: string;
  phone: string;
  email?: string;
  gender: "male" | "female" | "other";
  birthdate: Date;
  category: "student" | "teacher" | "employee" | "external";
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";
  notes?: string;
  allergies?: string[];
  registeredBy: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
}) {
  return Patient.findOneAndUpdate(
    { registrationNumber: data.registrationNumber },
    {
      $set: {
        ...data,
        status: "active",
        address: "Улаанбаатар хот",
        emergencyContact: {
          name: "Гэр бүлийн хүн",
          phone: "99112233",
          relationship: "Гэр бүл",
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertAppointment(data: {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  type: "walk_in" | "scheduled" | "follow_up" | "emergency";
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled" | "no_show";
  queueNumber?: number;
  chiefComplaint: string;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  checkedInBy?: mongoose.Types.ObjectId;
  checkedInAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}) {
  return Appointment.findOneAndUpdate(
    {
      patientId: data.patientId,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
    },
    { $set: data, $setOnInsert: { duration: 30 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertVisit(data: {
  appointmentId?: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  visitDate: Date;
  status: "draft" | "active" | "completed" | "cancelled";
  chiefComplaint: string;
  historyOfPresentIllness: string;
  physicalExamination: string;
  assessment: string;
  plan: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  completedAt?: Date;
}) {
  return Visit.findOneAndUpdate(
    data.appointmentId ? { appointmentId: data.appointmentId } : { patientId: data.patientId, chiefComplaint: data.chiefComplaint },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertVital(visitId: mongoose.Types.ObjectId, patientId: mongoose.Types.ObjectId, recordedBy: mongoose.Types.ObjectId, data: Record<string, number>) {
  return VitalSign.findOneAndUpdate(
    { visitId },
    { $set: { visitId, patientId, recordedBy, ...data } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertDiagnosis(data: {
  visitId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  icdCode: string;
  name: string;
  description: string;
  type: "primary" | "secondary" | "differential";
  severity: "mild" | "moderate" | "severe" | "critical";
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}) {
  return Diagnosis.findOneAndUpdate(
    { visitId: data.visitId, name: data.name, type: data.type },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertPrescription(data: {
  visitId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  prescriptionNumber: string;
  status: "active" | "dispensed" | "cancelled";
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  items: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    unit: string;
    instructions: string;
  }>;
}) {
  return Prescription.findOneAndUpdate(
    { prescriptionNumber: data.prescriptionNumber },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function replaceNotifications(entries: Array<{
  userId: mongoose.Types.ObjectId;
  title: string;
  type: "info" | "warning" | "success" | "request" | "appointment" | "treatment";
  read?: boolean;
  body: Record<string, unknown>;
}>) {
  await Notification.deleteMany({ title: { $regex: "^\\[Demo\\]" } });
  await Notification.insertMany(
    entries.map((entry) => ({
      ...entry,
      read: entry.read ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
}

async function replaceAuditLogs(entries: Array<{
  userId: mongoose.Types.ObjectId;
  action: "create" | "update" | "delete" | "login" | "logout" | "access" | "export";
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}>) {
  await AuditLog.deleteMany({ "details.seedTag": "demo-activity" });
  await AuditLog.insertMany(
    entries.map((entry) => ({
      ...entry,
      details: { ...(entry.details || {}), seedTag: "demo-activity" },
      ipAddress: "127.0.0.1",
      userAgent: "seed-demo-script",
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
}

async function seedDemo() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const departments = {
    general: await upsertDepartment("GENERAL", "Ерөнхий үзлэг", "Өдөр тутмын ерөнхий үзлэг, анхан шатны тусламж"),
    dental: await upsertDepartment("DENTAL", "Шүдний эмнэлэг", "Шүд, амны хөндийн үзлэг, эмчилгээ"),
    internal: await upsertDepartment("INTERNAL", "Дотрын эмгэг", "Дотрын өвчний үзлэг, хяналт"),
    ophthal: await upsertDepartment("OPHTHAL", "Нүдний эмнэлэг", "Нүдний үзлэг, харааны үнэлгээ"),
    surgery: await upsertDepartment("SURGERY", "Мэс засал", "Мэс заслын зөвлөгөө, дараах хяналт"),
    mental: await upsertDepartment("MENTAL", "Сэтгэцийн эрүүл мэнд", "Сэтгэл зүйн зөвлөгөө, дэмжлэг"),
  };

  const superAdmin = await upsertUser({
    phone: "99335671",
    password: "Test!123",
    firstname: "Хишигбаяр",
    lastname: "Бал",
    role: "superadmin",
    email: "khishigbayar.bal@demo.num.edu.mn",
    gender: "male",
  });

  const doctorUser = await upsertUser({
    phone: "99110011",
    password: "Doctor!123",
    firstname: "Эрдэнэбат",
    lastname: "Мөнхтөр",
    role: "doctor",
    email: "erdenebat.munkhtur@demo.num.edu.mn",
    gender: "male",
  });

  const dentistUser = await upsertUser({
    phone: "99110014",
    password: "Doctor!123",
    firstname: "Төгөлдөр",
    lastname: "Отгон",
    role: "doctor",
    email: "togoldor.otgon@demo.num.edu.mn",
    gender: "male",
  });

  const nurseUser = await upsertUser({
    phone: "99110012",
    password: "Nurse!123",
    firstname: "Оюунчимэг",
    lastname: "Сүхээ",
    role: "nurse",
    email: "oyuunchimeg.sukhee@demo.num.edu.mn",
    gender: "female",
  });

  const operatorUser = await upsertUser({
    phone: "99110013",
    password: "Operator!123",
    firstname: "Саруул",
    lastname: "Түмэнжаргал",
    role: "data_operator",
    email: "saruul.tumenjargal@demo.num.edu.mn",
    gender: "female",
  });

  const patientUser1 = await upsertUser({
    phone: "88112233",
    password: "Patient!123",
    firstname: "Тэмүүлэн",
    lastname: "Бат-Оргил",
    role: "patient",
    email: "temuulen.batorgil@demo.num.edu.mn",
    gender: "male",
  });

  const patientUser2 = await upsertUser({
    phone: "88112244",
    password: "Patient!123",
    firstname: "Номин-Эрдэнэ",
    lastname: "Батчимэг",
    role: "patient",
    email: "nominerdene.batchimeg@demo.num.edu.mn",
    gender: "female",
  });

  const patientUser3 = await upsertUser({
    phone: "88112288",
    password: "Patient!123",
    firstname: "Ган-Эрдэнэ",
    lastname: "Чулуун",
    role: "patient",
    email: "ganerdene.chuluun@demo.num.edu.mn",
    gender: "male",
  });

  const doctorStaff = await upsertStaff({
    userId: doctorUser._id,
    departmentId: departments.general._id,
    staffType: "doctor",
    specialization: "Ерөнхий эмч",
    licenseNumber: "DOC-DEMO-001",
    title: "Ахлах эмч",
    bio: "Оюутан, ажилтны анхан шатны тусламжийг хариуцдаг.",
    maxDailyAppointments: 18,
  });

  await upsertStaff({
    userId: nurseUser._id,
    departmentId: departments.general._id,
    staffType: "nurse",
    title: "Сувилагч",
    bio: "Үзлэгийн өмнөх хэмжилт, сувилгааны урсгалыг хариуцна.",
    maxDailyAppointments: 28,
  });

  await upsertStaff({
    userId: operatorUser._id,
    departmentId: departments.general._id,
    staffType: "data_operator",
    title: "Бүртгэлийн ажилтан",
    bio: "Өдөр тутмын бүртгэл, цаг товлолтыг хариуцна.",
    maxDailyAppointments: 40,
  });

  await upsertStaff({
    userId: dentistUser._id,
    departmentId: departments.dental._id,
    staffType: "doctor",
    specialization: "Шүдний эмч",
    licenseNumber: "DOC-DEMO-002",
    title: "Эмч",
    bio: "Шүдний өвдөлт, амны хөндийн үзлэг хийдэг.",
    maxDailyAppointments: 16,
  });

  const patient1 = await upsertPatient({
    registrationNumber: "REG-DEMO-001",
    firstname: "Тэмүүлэн",
    lastname: "Бат-Оргил",
    phone: "88112233",
    email: "temuulen.batorgil@demo.num.edu.mn",
    gender: "male",
    birthdate: new Date("2003-04-17"),
    category: "student",
    bloodType: "A+",
    allergies: ["Пенициллин"],
    notes: "Хаврын улиралд харшлын шинж илэрдэг.",
    registeredBy: operatorUser._id,
    userId: patientUser1._id,
  });

  const patient2 = await upsertPatient({
    registrationNumber: "REG-DEMO-002",
    firstname: "Номин-Эрдэнэ",
    lastname: "Батчимэг",
    phone: "88112244",
    email: "nominerdene.batchimeg@demo.num.edu.mn",
    gender: "female",
    birthdate: new Date("1999-11-02"),
    category: "employee",
    bloodType: "O+",
    notes: "Ачаалал ихсэх үед нойр дутуудах зовиуртай.",
    registeredBy: operatorUser._id,
    userId: patientUser2._id,
  });

  const patient3 = await upsertPatient({
    registrationNumber: "REG-DEMO-003",
    firstname: "Анужин",
    lastname: "Саран",
    phone: "88112255",
    gender: "female",
    birthdate: new Date("2001-08-24"),
    category: "student",
    bloodType: "B+",
    notes: "Давтан шүдний эмчилгээтэй.",
    registeredBy: superAdmin._id,
  });

  const patient4 = await upsertPatient({
    registrationNumber: "REG-DEMO-004",
    firstname: "Мөнхжин",
    lastname: "Энхсайхан",
    phone: "88112266",
    gender: "male",
    birthdate: new Date("1988-01-15"),
    category: "teacher",
    bloodType: "AB+",
    notes: "Даралт үе үе хэлбэлздэг.",
    registeredBy: superAdmin._id,
  });

  const patient5 = await upsertPatient({
    registrationNumber: "REG-DEMO-005",
    firstname: "Энхжин",
    lastname: "Батсүх",
    phone: "88112277",
    gender: "female",
    birthdate: new Date("2004-06-11"),
    category: "student",
    bloodType: "A-",
    notes: "Нүд хуурайшилттай, дэлгэцийн ачаалал өндөр.",
    registeredBy: operatorUser._id,
  });

  const patient6 = await upsertPatient({
    registrationNumber: "REG-DEMO-006",
    firstname: "Ган-Эрдэнэ",
    lastname: "Чулуун",
    phone: "88112288",
    email: "ganerdene.chuluun@demo.num.edu.mn",
    gender: "male",
    birthdate: new Date("1997-12-19"),
    category: "employee",
    bloodType: "O-",
    notes: "Улирлын чанартай нуруу өвдөлттэй.",
    registeredBy: superAdmin._id,
    userId: patientUser3._id,
  });

  const now = new Date();
  const twoDaysAgo = withTime(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), 9, 0);
  const yesterday = withTime(new Date(now.getTime() - 24 * 60 * 60 * 1000), 14, 0);
  const todayMorning = withTime(now, 10, 0);
  const todayAfternoon = withTime(now, 15, 30);
  const todayLate = withTime(now, 16, 20);
  const tomorrow = withTime(new Date(now.getTime() + 24 * 60 * 60 * 1000), 11, 0);

  const appointment1 = await upsertAppointment({
    patientId: patient1._id,
    doctorId: doctorStaff._id,
    departmentId: departments.general._id,
    scheduledDate: twoDaysAgo,
    scheduledTime: "09:00",
    type: "follow_up",
    status: "completed",
    queueNumber: 3,
    chiefComplaint: "Толгой өвдөх, ядаргаа",
    notes: "Demo appointment: completed flow",
    createdBy: operatorUser._id,
    checkedInBy: operatorUser._id,
    checkedInAt: withTime(twoDaysAgo, 8, 47),
  });

  const appointment2 = await upsertAppointment({
    patientId: patient2._id,
    doctorId: doctorStaff._id,
    departmentId: departments.general._id,
    scheduledDate: todayMorning,
    scheduledTime: "10:00",
    type: "scheduled",
    status: "checked_in",
    queueNumber: 6,
    chiefComplaint: "Нойргүйдэл, стресс",
    notes: "Demo appointment: checked in and waiting",
    createdBy: operatorUser._id,
    checkedInBy: operatorUser._id,
    checkedInAt: withTime(now, 9, 42),
  });

  await upsertAppointment({
    patientId: patient3._id,
    doctorId: doctorStaff._id,
    departmentId: departments.mental._id,
    scheduledDate: tomorrow,
    scheduledTime: "11:00",
    type: "scheduled",
    status: "scheduled",
    queueNumber: 2,
    chiefComplaint: "Шалгалтын үеийн түгшүүр",
    notes: "Demo appointment: upcoming",
    createdBy: superAdmin._id,
  });

  await upsertAppointment({
    patientId: patient4._id,
    doctorId: doctorStaff._id,
    departmentId: departments.general._id,
    scheduledDate: yesterday,
    scheduledTime: "14:00",
    type: "scheduled",
    status: "cancelled",
    chiefComplaint: "Даралт ихсэх",
    notes: "Demo appointment: cancelled",
    createdBy: operatorUser._id,
    cancelledAt: withTime(yesterday, 11, 25),
    cancelReason: "Өвчтөн өөрийн хүсэлтээр цуцалсан",
  });

  await upsertAppointment({
    patientId: patient3._id,
    doctorId: doctorStaff._id,
    departmentId: departments.dental._id,
    scheduledDate: todayAfternoon,
    scheduledTime: "15:30",
    type: "walk_in",
    status: "no_show",
    queueNumber: 11,
    chiefComplaint: "Шүд өвдөх",
    notes: "Demo appointment: no show",
    createdBy: operatorUser._id,
  });

  const appointment6 = await upsertAppointment({
    patientId: patient6._id,
    doctorId: doctorStaff._id,
    departmentId: departments.general._id,
    scheduledDate: todayLate,
    scheduledTime: "16:20",
    type: "walk_in",
    status: "in_progress",
    queueNumber: 12,
    chiefComplaint: "Нуруу чилж өвдөх",
    notes: "Demo appointment: currently in progress",
    createdBy: operatorUser._id,
    checkedInBy: operatorUser._id,
    checkedInAt: withTime(now, 16, 2),
  });

  const visit1 = await upsertVisit({
    appointmentId: appointment1._id,
    patientId: patient1._id,
    doctorId: doctorStaff._id,
    visitDate: withTime(twoDaysAgo, 9, 18),
    status: "completed",
    chiefComplaint: "Толгой өвдөх, ядаргаа",
    historyOfPresentIllness: "Сүүлийн 5 хоног хичээлийн ачаалалтай, ус бага уусан.",
    physicalExamination: "Биеийн ерөнхий байдал тогтвортой, халуураагүй.",
    assessment: "Stress-related tension headache",
    plan: "Шингэн сайн уух, амралт авах, шаардлагатай үед өвдөлт намдаах эм хэрэглэх.",
    notes: "3 хоногийн дараа дахин хянана.",
    completedAt: withTime(twoDaysAgo, 9, 41),
    createdBy: doctorUser._id,
  });

  const visit2 = await upsertVisit({
    appointmentId: appointment2._id,
    patientId: patient2._id,
    doctorId: doctorStaff._id,
    visitDate: withTime(now, 10, 18),
    status: "active",
    chiefComplaint: "Нойргүйдэл, стресс",
    historyOfPresentIllness: "Сүүлийн хоёр долоо хоногт ажил ихтэй, нойрны хэм алдагдсан.",
    physicalExamination: "Амьсгал, зүрхний цохилт хэвийн. Ядарсан байдал ажиглагдана.",
    assessment: "Acute stress response",
    plan: "Амралтын хуваарь тохируулах, хэрэгцээтэй бол сэтгэл зүйн зөвлөгөөнд илгээх.",
    notes: "Өнөөдөр зөвлөгөө өгч, 7 хоногийн дараа follow-up хийнэ.",
    createdBy: doctorUser._id,
  });

  const visit3 = await upsertVisit({
    appointmentId: appointment6._id,
    patientId: patient6._id,
    doctorId: doctorStaff._id,
    visitDate: withTime(now, 16, 28),
    status: "active",
    chiefComplaint: "Нуруу чилж өвдөх",
    historyOfPresentIllness: "Сүүлийн сар удаан сууж ажилласнаас бүсэлхий орчим зовиуртай болсон.",
    physicalExamination: "Булчингийн чангарсан байдалтай, мэдрэлийн алдагдалгүй.",
    assessment: "Mechanical low back pain",
    plan: "Сунгалтын дасгал, ачаалал бууруулах, шаардлагатай үед NSAID хэрэглэх.",
    notes: "2 долоо хоногийн дараа эргэн үзэх.",
    createdBy: doctorUser._id,
  });

  await upsertVital(visit1._id, patient1._id, nurseUser._id, {
    temperature: 36.7,
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 76,
    heartRate: 74,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    weight: 68,
    height: 176,
  });

  await upsertVital(visit2._id, patient2._id, nurseUser._id, {
    temperature: 36.5,
    bloodPressureSystolic: 110,
    bloodPressureDiastolic: 72,
    heartRate: 82,
    respiratoryRate: 17,
    oxygenSaturation: 99,
    weight: 57,
    height: 164,
  });

  await upsertVital(visit3._id, patient6._id, nurseUser._id, {
    temperature: 36.4,
    bloodPressureSystolic: 124,
    bloodPressureDiastolic: 81,
    heartRate: 79,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    weight: 83,
    height: 179,
  });

  await upsertDiagnosis({
    visitId: visit1._id,
    patientId: patient1._id,
    doctorId: doctorStaff._id,
    icdCode: "R51",
    name: "Түгшүүрээс шалтгаалсан толгой өвдөлт",
    description: "Хэт ачаалал, ус бага ууснаас үүдэлтэй шинжтэй.",
    type: "primary",
    severity: "mild",
    notes: "Амралт, шингэн нэмэгдүүлэх зөвлөмж өгсөн.",
    createdBy: doctorUser._id,
  });

  await upsertDiagnosis({
    visitId: visit2._id,
    patientId: patient2._id,
    doctorId: doctorStaff._id,
    icdCode: "F43.0",
    name: "Хурц стрессийн урвал",
    description: "Ажлын ачааллаас шалтгаалсан нойргүйдэл, түгшүүр.",
    type: "primary",
    severity: "moderate",
    notes: "Давтан үнэлгээ хийхээр төлөвлөсөн.",
    createdBy: doctorUser._id,
  });

  await upsertDiagnosis({
    visitId: visit3._id,
    patientId: patient6._id,
    doctorId: doctorStaff._id,
    icdCode: "M54.5",
    name: "Бүсэлхий нурууны өвдөлт",
    description: "Удаан хугацааны суугаа ажлын ачааллаас сэдэрсэн шинжтэй.",
    type: "primary",
    severity: "moderate",
    notes: "Хөдөлгөөний дэглэм болон сунгалтын дасгал зөвлөсөн.",
    createdBy: doctorUser._id,
  });

  await upsertPrescription({
    visitId: visit1._id,
    patientId: patient1._id,
    doctorId: doctorStaff._id,
    prescriptionNumber: "RX-DEMO-001",
    status: "dispensed",
    notes: "Demo prescription for completed visit",
    createdBy: doctorUser._id,
    items: [
      {
        medicationName: "Paracetamol",
        dosage: "500mg",
        frequency: "Өдөрт 3 удаа",
        duration: "3 өдөр",
        quantity: 9,
        unit: "tablet",
        instructions: "Хоолны дараа ууна.",
      },
      {
        medicationName: "Oral Rehydration Salts",
        dosage: "1 sachet",
        frequency: "Өдөрт 1 удаа",
        duration: "2 өдөр",
        quantity: 2,
        unit: "sachet",
        instructions: "Шингэн сайн уухтай хамт хэрэглэнэ.",
      },
    ],
  });

  await upsertPrescription({
    visitId: visit2._id,
    patientId: patient2._id,
    doctorId: doctorStaff._id,
    prescriptionNumber: "RX-DEMO-002",
    status: "active",
    notes: "Demo prescription for active visit",
    createdBy: doctorUser._id,
    items: [
      {
        medicationName: "Melatonin",
        dosage: "3mg",
        frequency: "Унтахын өмнө",
        duration: "7 өдөр",
        quantity: 7,
        unit: "tablet",
        instructions: "7 хоног хэрэглээд дахин үнэлнэ.",
      },
    ],
  });

  await upsertPrescription({
    visitId: visit3._id,
    patientId: patient6._id,
    doctorId: doctorStaff._id,
    prescriptionNumber: "RX-DEMO-003",
    status: "active",
    notes: "Demo prescription for low back pain",
    createdBy: doctorUser._id,
    items: [
      {
        medicationName: "Ibuprofen",
        dosage: "400mg",
        frequency: "Өдөрт 2 удаа",
        duration: "5 өдөр",
        quantity: 10,
        unit: "tablet",
        instructions: "Хоолны дараа ууна.",
      },
      {
        medicationName: "Topical Diclofenac Gel",
        dosage: "2%",
        frequency: "Өдөрт 2 удаа",
        duration: "7 өдөр",
        quantity: 1,
        unit: "tube",
        instructions: "Өвдөж буй хэсэгт нимгэн түрхэнэ.",
      },
    ],
  });

  await replaceNotifications([
    {
      userId: superAdmin._id,
      title: "[Demo] Өнөөдрийн ачааллын нэгтгэл",
      type: "info",
      body: { scheduled: 1, checkedIn: 1, inProgress: 1, completed: 1, cancelled: 1 },
    },
    {
      userId: doctorUser._id,
      title: "[Demo] Шинэ үзлэг хүлээгдэж байна",
      type: "appointment",
      body: { patient: `${patient2.lastname} ${patient2.firstname}`, time: "10:00", room: "101" },
    },
    {
      userId: doctorUser._id,
      title: "[Demo] Follow-up үзлэг үргэлжилж байна",
      type: "warning",
      body: { patient: `${patient6.lastname} ${patient6.firstname}`, status: "active", room: "103" },
    },
    {
      userId: operatorUser._id,
      title: "[Demo] Маргаашийн цаг баталгаажсан",
      type: "success",
      read: true,
      body: { patient: `${patient3.lastname} ${patient3.firstname}`, time: "11:00" },
    },
    {
      userId: patientUser1._id,
      title: "[Demo] Эмийн жор бэлэн боллоо",
      type: "treatment",
      body: { prescriptionNumber: "RX-DEMO-001", status: "dispensed" },
    },
  ]);

  await replaceAuditLogs([
    {
      userId: superAdmin._id,
      action: "access",
      resource: "demo_seed",
      resourceId: "demo-activity",
      details: { summary: "Expanded demo activity data prepared" },
    },
    {
      userId: operatorUser._id,
      action: "create",
      resource: "appointment",
      resourceId: appointment1._id.toString(),
      details: { patient: patient1.registrationNumber },
    },
    {
      userId: doctorUser._id,
      action: "update",
      resource: "visit",
      resourceId: visit2._id.toString(),
      details: { status: "active", patient: patient2.registrationNumber },
    },
    {
      userId: doctorUser._id,
      action: "update",
      resource: "visit",
      resourceId: visit3._id.toString(),
      details: { status: "active", patient: patient6.registrationNumber },
    },
    {
      userId: doctorUser._id,
      action: "create",
      resource: "prescription",
      resourceId: "RX-DEMO-003",
      details: { patient: patient6.registrationNumber },
    },
  ]);

  const counts = await Promise.all([
    Department.countDocuments({ code: { $in: ["GENERAL", "DENTAL", "INTERNAL", "OPHTHAL", "SURGERY", "MENTAL"] } }),
    Staff.countDocuments({ userId: { $in: [doctorUser._id, dentistUser._id, nurseUser._id, operatorUser._id] } }),
    Patient.countDocuments({ registrationNumber: { $regex: "^REG-DEMO-" } }),
    Appointment.countDocuments({ notes: { $regex: "^Demo appointment:" } }),
    Visit.countDocuments({}),
    Prescription.countDocuments({ prescriptionNumber: { $regex: "^RX-DEMO-" } }),
    Notification.countDocuments({ title: { $regex: "^\\[Demo\\]" } }),
    AuditLog.countDocuments({ "details.seedTag": "demo-activity" }),
  ]);

  console.log("Demo seed completed");
  console.log(`Departments ready: ${counts[0]}`);
  console.log(`Staff ready: ${counts[1]}`);
  console.log(`Patients ready: ${counts[2]}`);
  console.log(`Appointments ready: ${counts[3]}`);
  console.log(`Visits ready: ${counts[4]}`);
  console.log(`Prescriptions ready: ${counts[5]}`);
  console.log(`Notifications ready: ${counts[6]}`);
  console.log(`Audit logs ready: ${counts[7]}`);
  console.log("Superadmin login: 99335671 / Test!123");

  await mongoose.disconnect();
}

seedDemo().catch(async (err) => {
  console.error("Demo seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
