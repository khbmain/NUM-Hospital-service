// @ts-nocheck
import mongoose from "mongoose";
import { DateTime } from "luxon";
import { MONGODB_URI } from "./utils/constants";
import { encryptPassword } from "./utils/auth";
import { Department } from "./models/departmentModel";
import { User } from "./models/userModel";
import { Staff } from "./models/staffModel";
import { Service } from "./models/serviceModel";
import { Resource } from "./models/resourceModel";
import { Patient } from "./models/patientModel";
import { Appointment } from "./models/appointmentModel";
import { Visit } from "./models/visitModel";
import { VitalSign } from "./models/vitalSignModel";
import { Diagnosis } from "./models/diagnosisModel";
import { Prescription } from "./models/prescriptionModel";
import { Notification } from "./models/notificationModel";
import { AuditLog } from "./models/auditLogModel";
import { ExternalIdentity } from "./models/externalIdentityModel";
import { SatisfactionSurvey } from "./models/satisfactionSurveyModel";

const SEED_TAG = "BULK_TEST_2026";
const TZ = "Asia/Ulaanbaatar";
const PATIENT_COUNT = 500;
const PASSWORD = "Test!123";

function createRandom(seed = 20260515) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const random = createRandom();

function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)];
}

function chance(probability: number) {
  return random() < probability;
}

function int(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function hospitalDateTime(day: DateTime, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return day.set({ hour, minute, second: 0, millisecond: 0 });
}

function nextWorkday(day: DateTime) {
  let current = day;
  while (current.weekday > 5) current = current.plus({ days: 1 });
  return current;
}

function randomWorkday(daysFromNowMin: number, daysFromNowMax: number) {
  const today = DateTime.now().setZone(TZ).startOf("day");
  return nextWorkday(today.plus({ days: int(daysFromNowMin, daysFromNowMax) }));
}

function buildWorkWeek(startTime = "08:30", endTime = "17:30") {
  return [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startTime, endTime }));
}

const maleFirstNames = [
  "Тэмүүлэн", "Билгүүн", "Энх-Амгалан", "Мөнх-Эрдэнэ", "Ган-Эрдэнэ", "Бат-Оргил",
  "Төгөлдөр", "Дөлгөөн", "Энхтөр", "Мөнхжин", "Хүслэн", "Тэнүүн", "Идэр", "Содбилэг",
  "Наранбаатар", "Эрдэнэбат", "Батжаргал", "Чингүүн", "Ананд", "Итгэл",
];
const femaleFirstNames = [
  "Номин", "Анужин", "Энхжин", "Хулан", "Марал", "Уянга", "Саруул", "Ариунзаяа",
  "Болор-Эрдэнэ", "Нандин-Эрдэнэ", "Энхриймаа", "Солонго", "Азжаргал", "Оюунчимэг",
  "Мөнхзаяа", "Ану", "Ялгуун", "Хишигсүрэн", "Тэргэл", "Энэрэл",
];
const lastNames = [
  "Бат", "Энх", "Болд", "Ганбаатар", "Мөнхбат", "Сүхбаатар", "Наран", "Даваа",
  "Цэрэн", "Бямба", "Отгон", "Жаргал", "Түмэн", "Чулуун", "Алтан", "Эрдэнэ",
  "Сайнбаяр", "Лхагва", "Очир", "Ганзориг", "Батсайхан", "Дашдорж",
];
const streets = [
  "Баянзүрх дүүрэг 13-р хороо", "Сүхбаатар дүүрэг 8-р хороо", "Хан-Уул дүүрэг 15-р хороо",
  "Баянгол дүүрэг 6-р хороо", "Чингэлтэй дүүрэг 5-р хороо", "Сонгинохайрхан дүүрэг 18-р хороо",
  "Налайх дүүрэг", "Дархан-Уул аймаг", "Орхон аймаг", "Төв аймаг Зуунмод",
];
const relationships = ["Ээж", "Аав", "Ах", "Эгч", "Нөхөр", "Эхнэр", "Асран хамгаалагч"];
const allergies = ["Пенициллин", "Тоос", "Самар", "Сүү", "Өндөг", "Антибиотик", "Иод", "Харшилгүй"];
const chronicConditions = ["Артерийн даралт ихсэх", "Харшлын ринит", "Астма", "Ходоодны үрэвсэл", "Чихрийн шижин II", "Бамбай булчирхайн өөрчлөлт", "Архаг өвчингүй"];
const medications = ["Лоратадин", "Омепразол", "Метформин", "Амлодипин", "Витамин D", "Тогтмол эмгүй"];
const bloodTypes = ["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const categories = ["student", "student", "student", "teacher", "employee", "external"];

const cases = [
  {
    complaint: "Хоолой өвдөж, хамар битүүрсэн",
    diagnosis: "Амьсгалын дээд замын цочмог халдвар",
    icdCode: "J06.9",
    icdTitle: "Acute upper respiratory infection, unspecified",
    severity: "mild",
    plan: "Шингэн сайн уух, амрах, халуун бууруулах эмийг шаардлагатай үед хэрэглэх.",
    prescriptions: [
      { medicationName: "Парацетамол", dosage: "500 мг", frequency: "Өдөрт 3 удаа", duration: "3 өдөр", quantity: 9, unit: "шахмал", instructions: "38.5°C-аас дээш халуурвал ууна" },
      { medicationName: "Витамин C", dosage: "500 мг", frequency: "Өдөрт 1 удаа", duration: "7 өдөр", quantity: 7, unit: "шахмал" },
    ],
  },
  {
    complaint: "Ходоод өвдөж, цээж хорссон",
    diagnosis: "Ходоодны үрэвсэл",
    icdCode: "K29.7",
    icdTitle: "Gastritis, unspecified",
    severity: "moderate",
    plan: "Хоолны дэглэм баримтлах, кофе болон халуун ногоотой хоолноос зайлсхийх.",
    prescriptions: [
      { medicationName: "Омепразол", dosage: "20 мг", frequency: "Өглөө өлөн үед", duration: "14 өдөр", quantity: 14, unit: "капсул" },
      { medicationName: "Маалокс", dosage: "15 мл", frequency: "Өдөрт 2 удаа", duration: "5 өдөр", quantity: 1, unit: "сав" },
    ],
  },
  {
    complaint: "Толгой өвдөж, нойр муудсан",
    diagnosis: "Толгой өвдөлт",
    icdCode: "R51",
    icdTitle: "Headache",
    severity: "mild",
    plan: "Дэлгэцийн хэрэглээг багасгах, ус сайн уух, даралт хянах.",
    prescriptions: [
      { medicationName: "Ибупрофен", dosage: "400 мг", frequency: "Өдөрт 2 удаа", duration: "3 өдөр", quantity: 6, unit: "шахмал", instructions: "Хоолны дараа" },
    ],
  },
  {
    complaint: "Нуруу чилж өвдсөн",
    diagnosis: "Бүсэлхийн булчингийн суналт",
    icdCode: "M54.5",
    icdTitle: "Low back pain",
    severity: "moderate",
    plan: "Хүнд юм өргөхгүй байх, дулаан жин тавих, дасгал хөдөлгөөн аажмаар хийх.",
    prescriptions: [
      { medicationName: "Диклофенак гель", dosage: "1%", frequency: "Өдөрт 2 удаа түрхэнэ", duration: "7 өдөр", quantity: 1, unit: "туб" },
      { medicationName: "Мидокалм", dosage: "150 мг", frequency: "Өдөрт 2 удаа", duration: "5 өдөр", quantity: 10, unit: "шахмал" },
    ],
  },
  {
    complaint: "Арьс загатнаж тууралт гарсан",
    diagnosis: "Харшлын дерматит",
    icdCode: "L23.9",
    icdTitle: "Allergic contact dermatitis, unspecified cause",
    severity: "mild",
    plan: "Харшил өдөөгчөөс зайлсхийх, тууралт нэмэгдвэл дахин үзүүлэх.",
    prescriptions: [
      { medicationName: "Лоратадин", dosage: "10 мг", frequency: "Өдөрт 1 удаа", duration: "7 өдөр", quantity: 7, unit: "шахмал" },
      { medicationName: "Гидрокортизон тос", dosage: "1%", frequency: "Нимгэн түрхэнэ", duration: "5 өдөр", quantity: 1, unit: "туб" },
    ],
  },
  {
    complaint: "Шээс ойр ойрхон хүрч, хорсож өвдсөн",
    diagnosis: "Шээсний замын халдвар",
    icdCode: "N39.0",
    icdTitle: "Urinary tract infection, site not specified",
    severity: "moderate",
    plan: "Шингэн нэмэх, шинжилгээний хариугаар эмчилгээ үргэлжлүүлэх.",
    prescriptions: [
      { medicationName: "Нитрофурантоин", dosage: "100 мг", frequency: "Өдөрт 2 удаа", duration: "5 өдөр", quantity: 10, unit: "капсул" },
    ],
  },
  {
    complaint: "Даралт ихсэж, хүзүү хөшсөн",
    diagnosis: "Артерийн даралт ихсэх",
    icdCode: "I10",
    icdTitle: "Essential hypertension",
    severity: "moderate",
    plan: "Давс багасгах, даралтаа өглөө оройд хэмжиж тэмдэглэх.",
    prescriptions: [
      { medicationName: "Амлодипин", dosage: "5 мг", frequency: "Өдөрт 1 удаа", duration: "30 өдөр", quantity: 30, unit: "шахмал" },
    ],
  },
  {
    complaint: "Ядарч сульдан, толгой эргэсэн",
    diagnosis: "Цус багадалт",
    icdCode: "D64.9",
    icdTitle: "Anaemia, unspecified",
    severity: "mild",
    plan: "Цусны дэлгэрэнгүй шинжилгээ өгөх, төмөр ихтэй хоол хүнс хэрэглэх.",
    prescriptions: [
      { medicationName: "Төмрийн бэлдмэл", dosage: "60 мг", frequency: "Өдөрт 1 удаа", duration: "30 өдөр", quantity: 30, unit: "шахмал" },
      { medicationName: "Фолийн хүчил", dosage: "1 мг", frequency: "Өдөрт 1 удаа", duration: "30 өдөр", quantity: 30, unit: "шахмал" },
    ],
  },
];

async function cleanPreviousSeed() {
  const generatedPatients = await Patient.find({
    $or: [
      { notes: new RegExp(SEED_TAG) },
      { registrationNumber: /^ТД/ },
    ],
  }).select("_id userId");
  const patientIds = generatedPatients.map((patient) => patient._id);
  const userIds = generatedPatients.map((patient) => patient.userId).filter(Boolean);
  const generatedUsers = await User.find({
    $or: [
      { email: /@bulk-test\.num\.edu\.mn$/ },
      { phone: /^85/ },
    ],
  }).select("_id");
  userIds.push(...generatedUsers.map((user) => user._id));

  const generatedStaff = await Staff.find({ licenseNumber: new RegExp(`^${SEED_TAG}`) }).select("_id userId");
  const staffIds = generatedStaff.map((staff) => staff._id);
  userIds.push(...generatedStaff.map((staff) => staff.userId).filter(Boolean));

  const generatedServices = await Service.find({ code: new RegExp(`^${SEED_TAG}`) }).select("_id");
  const serviceIds = generatedServices.map((service) => service._id);
  const generatedResources = await Resource.find({ notes: new RegExp(SEED_TAG) }).select("_id");
  const resourceIds = generatedResources.map((resource) => resource._id);
  const generatedDepartments = await Department.find({ code: new RegExp(`^${SEED_TAG}`) }).select("_id");
  const departmentIds = generatedDepartments.map((department) => department._id);
  const generatedVisits = await Visit.find({
    $or: [
      { patientId: { $in: patientIds } },
      { notes: new RegExp(SEED_TAG) },
    ],
  }).select("_id");
  const visitIds = generatedVisits.map((visit) => visit._id);

  await Promise.all([
    Prescription.deleteMany({ $or: [{ patientId: { $in: patientIds } }, { prescriptionNumber: new RegExp(`^${SEED_TAG}`) }] }),
    Diagnosis.deleteMany({ $or: [{ patientId: { $in: patientIds } }, { notes: new RegExp(SEED_TAG) }] }),
    VitalSign.deleteMany({ $or: [{ patientId: { $in: patientIds } }, { visitId: { $in: visitIds } }] }),
    SatisfactionSurvey.deleteMany({ $or: [{ patientId: { $in: patientIds } }, { userId: { $in: userIds } }] }),
    Notification.deleteMany({ userId: { $in: userIds } }),
    AuditLog.deleteMany({ "details.seedTag": SEED_TAG }),
  ]);

  await Visit.deleteMany({ $or: [{ patientId: { $in: patientIds } }, { notes: new RegExp(SEED_TAG) }] });
  await Appointment.deleteMany({
    $or: [
      { patientId: { $in: patientIds } },
      { serviceId: { $in: serviceIds } },
      { resourceId: { $in: resourceIds } },
      { notes: new RegExp(SEED_TAG) },
    ],
  });
  await Patient.deleteMany({ _id: { $in: patientIds } });
  await Resource.deleteMany({ _id: { $in: resourceIds } });
  await Service.deleteMany({ _id: { $in: serviceIds } });
  await Staff.deleteMany({ _id: { $in: staffIds } });
  await Department.deleteMany({ _id: { $in: departmentIds } });
  await ExternalIdentity.deleteMany({ userId: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
}

async function createStaffAndServices() {
  const departments = await Department.insertMany([
    { code: `${SEED_TAG}_GENERAL`, name: "Оюутны эрүүл мэндийн төв", description: "Тест дата: ерөнхий үзлэг", isActive: true },
    { code: `${SEED_TAG}_TREATMENT`, name: "Сувилгаа, эмчилгээний хэсэг", description: "Тест дата: тариа, дусал, төхөөрөмж", isActive: true },
  ]);
  const [generalDepartment, treatmentDepartment] = departments;

  const staffProfiles = [
    { role: "doctor", staffType: "doctor", phone: "85999001", firstname: "Таравсүрэн", lastname: "Ганболд", gender: "male", specialization: "Ерөнхий эмч", title: "Ахлах эмч", departmentId: generalDepartment._id },
    { role: "doctor", staffType: "doctor", phone: "85999002", firstname: "Оюунгэрэл", lastname: "Батцэцэг", gender: "female", specialization: "Дотрын эмч", title: "Их эмч", departmentId: generalDepartment._id },
    { role: "doctor", staffType: "doctor", phone: "85999003", firstname: "Бат-Эрдэнэ", lastname: "Сэргэлэн", gender: "male", specialization: "Мэдрэлийн эмч", title: "Их эмч", departmentId: generalDepartment._id },
    { role: "doctor", staffType: "doctor", phone: "85999004", firstname: "Ариунзул", lastname: "Даваасүрэн", gender: "female", specialization: "Арьс харшлын эмч", title: "Их эмч", departmentId: generalDepartment._id },
    { role: "nurse", staffType: "nurse", phone: "85999005", firstname: "Наранцэцэг", lastname: "Пүрэв", gender: "female", specialization: "Ахлах сувилагч", title: "Сувилагч", departmentId: treatmentDepartment._id },
    { role: "nurse", staffType: "nurse", phone: "85999006", firstname: "Солонго", lastname: "Мягмар", gender: "female", specialization: "Эмчилгээний сувилагч", title: "Сувилагч", departmentId: treatmentDepartment._id },
  ];

  const staffUsers = await User.insertMany(staffProfiles.map((profile, index) => ({
    phone: profile.phone,
    email: `staff${index + 1}@bulk-test.num.edu.mn`,
    password: encryptPassword(PASSWORD),
    firstname: profile.firstname,
    lastname: profile.lastname,
    role: profile.role,
    gender: profile.gender,
    status: "active",
    phoneVerified: true,
    lastLoginAt: DateTime.now().minus({ days: int(1, 12) }).toJSDate(),
  })));

  const staff = await Staff.insertMany(staffProfiles.map((profile, index) => ({
    userId: staffUsers[index]._id,
    departmentId: profile.departmentId,
    staffType: profile.staffType,
    specialization: profile.specialization,
    licenseNumber: `${SEED_TAG}-STAFF-${String(index + 1).padStart(3, "0")}`,
    title: profile.title,
    bio: `${profile.specialization} - бодит workflow шалгах зориулалтын тест ажилтан.`,
    isAvailable: true,
    workSchedule: buildWorkWeek(),
    maxDailyAppointments: profile.staffType === "doctor" ? 28 : 38,
    status: "active",
  })));

  const doctors = staff.filter((item) => item.staffType === "doctor");
  const nurses = staff.filter((item) => item.staffType === "nurse");

  const serviceDocs = await Service.insertMany([
    {
      code: `${SEED_TAG}_GENERAL_CONSULT`,
      name: "Ерөнхий эмчийн үзлэг",
      category: "consultation",
      description: "Толгой өвдөх, халуурах, хоолой өвдөх, ядаргаа зэрэг түгээмэл зовиурын анхан үзлэг.",
      defaultDurationMinutes: 20,
      defaultBufferMinutes: 5,
      requiresDoctor: true,
      assignedStaffIds: doctors.map((doctor) => doctor._id),
      isActive: true,
    },
    {
      code: `${SEED_TAG}_INTERNAL_CONSULT`,
      name: "Дотрын эмчийн зөвлөгөө",
      category: "consultation",
      description: "Даралт, ходоод, дотор эрхтний архаг болон давтамжтай зовиурын зөвлөгөө.",
      defaultDurationMinutes: 25,
      defaultBufferMinutes: 5,
      requiresDoctor: true,
      assignedStaffIds: doctors.slice(0, 3).map((doctor) => doctor._id),
      isActive: true,
    },
    {
      code: `${SEED_TAG}_INJECTION`,
      name: "Сувилагчийн тариа",
      category: "injection",
      description: "Эмчийн зааврын дагуу булчин болон судасны тариа хийх үйлчилгээ.",
      defaultDurationMinutes: 15,
      defaultBufferMinutes: 0,
      requiresNurse: true,
      assignedStaffIds: nurses.map((nurse) => nurse._id),
      isActive: true,
    },
    {
      code: `${SEED_TAG}_INFUSION`,
      name: "Дуслын үйлчилгээ",
      category: "infusion",
      description: "Шингэн нөхөх, эмчилгээний дусал хийх зориулалтын өрөө.",
      defaultDurationMinutes: 90,
      defaultBufferMinutes: 10,
      requiresNurse: true,
      assignedStaffIds: nurses.map((nurse) => nurse._id),
      isActive: true,
    },
    {
      code: `${SEED_TAG}_UHF`,
      name: "УВЧ шарлага",
      category: "device",
      description: "Булчин, үе мөчний өвдөлт болон үрэвслийн үед хийх физик эмчилгээ.",
      defaultDurationMinutes: 20,
      defaultBufferMinutes: 10,
      requiresDevice: true,
      assignedStaffIds: nurses.map((nurse) => nurse._id),
      isActive: true,
    },
    {
      code: `${SEED_TAG}_MASSAGE_CHAIR`,
      name: "Массажны сандал",
      category: "device",
      description: "Нуруу, хүзүү мөрний чилээ тайлах богино хугацааны сэргээн засах үйлчилгээ.",
      defaultDurationMinutes: 30,
      defaultBufferMinutes: 10,
      requiresDevice: true,
      assignedStaffIds: nurses.map((nurse) => nurse._id),
      isActive: true,
    },
    {
      code: `${SEED_TAG}_LAB_BASIC`,
      name: "Цусны ерөнхий шинжилгээ",
      category: "lab",
      description: "Анхан шатны цусны ерөнхий үзүүлэлтийн сорьц авах үйлчилгээ.",
      defaultDurationMinutes: 10,
      defaultBufferMinutes: 0,
      requiresNurse: true,
      assignedStaffIds: nurses.map((nurse) => nurse._id),
      isActive: true,
    },
  ]);

  const serviceByCode = Object.fromEntries(serviceDocs.map((service) => [service.code, service]));
  const resources = await Resource.insertMany([
    ...doctors.map((doctor, index) => ({
      name: `Тест эмчийн кабинет ${101 + index}`,
      type: "doctor",
      category: "consultation",
      staffId: doctor._id,
      serviceIds: [serviceByCode[`${SEED_TAG}_GENERAL_CONSULT`]._id, serviceByCode[`${SEED_TAG}_INTERNAL_CONSULT`]._id],
      room: `${101 + index}`,
      capacity: 1,
      slotIntervalMinutes: 30,
      defaultDurationMinutes: 20 + (index % 2) * 5,
      defaultBufferMinutes: 5,
      workSchedule: buildWorkWeek(),
      isActive: true,
      notes: `${SEED_TAG}: Эмчийн үзлэгийн кабинет`,
    })),
    {
      name: "Тест тарилгын өрөө 201",
      type: "room",
      category: "injection",
      staffId: nurses[0]._id,
      serviceIds: [serviceByCode[`${SEED_TAG}_INJECTION`]._id],
      room: "201",
      capacity: 2,
      slotIntervalMinutes: 15,
      defaultDurationMinutes: 15,
      defaultBufferMinutes: 0,
      workSchedule: buildWorkWeek(),
      isActive: true,
      notes: `${SEED_TAG}: Тарилгын үйлчилгээний өрөө`,
    },
    {
      name: "Тест дуслын өрөө 202",
      type: "capacity_room",
      category: "infusion",
      staffId: nurses[1]._id,
      serviceIds: [serviceByCode[`${SEED_TAG}_INFUSION`]._id],
      room: "202",
      capacity: 4,
      slotIntervalMinutes: 30,
      defaultDurationMinutes: 90,
      defaultBufferMinutes: 10,
      workSchedule: buildWorkWeek(),
      isActive: true,
      notes: `${SEED_TAG}: Дуслын 4 ортой өрөө`,
    },
    {
      name: "Тест УВЧ аппарат",
      type: "device",
      category: "irradiation",
      serviceIds: [serviceByCode[`${SEED_TAG}_UHF`]._id],
      room: "203",
      capacity: 1,
      slotIntervalMinutes: 30,
      defaultDurationMinutes: 20,
      defaultBufferMinutes: 10,
      workSchedule: buildWorkWeek(),
      isActive: true,
      notes: `${SEED_TAG}: УВЧ шарлагын төхөөрөмж`,
    },
    {
      name: "Тест массажны сандал",
      type: "device",
      category: "massage_chair",
      serviceIds: [serviceByCode[`${SEED_TAG}_MASSAGE_CHAIR`]._id],
      room: "204",
      capacity: 1,
      slotIntervalMinutes: 40,
      defaultDurationMinutes: 30,
      defaultBufferMinutes: 10,
      workSchedule: buildWorkWeek(),
      isActive: true,
      notes: `${SEED_TAG}: Массажны сандал`,
    },
    {
      name: "Тест сорьц авах хэсэг",
      type: "room",
      category: "lab",
      staffId: nurses[0]._id,
      serviceIds: [serviceByCode[`${SEED_TAG}_LAB_BASIC`]._id],
      room: "205",
      capacity: 3,
      slotIntervalMinutes: 10,
      defaultDurationMinutes: 10,
      defaultBufferMinutes: 0,
      workSchedule: buildWorkWeek(),
      isActive: true,
      notes: `${SEED_TAG}: Лабораторийн сорьц авах хэсэг`,
    },
  ]);

  return { departments, staffUsers, staff, doctors, nurses, services: serviceDocs, resources };
}

function buildPatient(index: number, userId?: any, registeredBy?: any) {
  const gender = chance(0.53) ? "female" : "male";
  const firstname = gender === "female" ? pick(femaleFirstNames) : pick(maleFirstNames);
  const lastname = pick(lastNames);
  const age = pick([18, 19, 20, 21, 22, 23, 24, 25, 28, 31, 35, 42, 49, 56, 62]);
  const birthdate = DateTime.now().setZone(TZ).minus({ years: age, days: int(0, 364) }).startOf("day").toJSDate();
  const regNumber = `ТД${String(26000000 + index).padStart(8, "0")}`;
  const phone = String(85000000 + index).padStart(8, "0");
  const category = pick(categories);
  const allergy = chance(0.28) ? [pick(allergies.filter((item) => item !== "Харшилгүй"))] : [];
  const chronic = chance(0.22) ? [pick(chronicConditions.filter((item) => item !== "Архаг өвчингүй"))] : [];
  const meds = chronic.length && chance(0.58) ? [pick(medications.filter((item) => item !== "Тогтмол эмгүй"))] : [];

  return {
    registrationNumber: regNumber,
    firstname,
    lastname,
    phone,
    email: `${regNumber.toLowerCase()}@bulk-test.num.edu.mn`,
    gender,
    birthdate,
    category,
    bloodType: pick(bloodTypes),
    allergies: allergy,
    chronicConditions: chronic,
    regularMedications: meds,
    medicalWarnings: allergy.length ? [`${allergy[0]} харшилтай`] : [],
    emergencyContact: {
      name: `${pick(lastNames)} ${pick(gender === "female" ? maleFirstNames : femaleFirstNames)}`,
      phone: String(88000000 + index).padStart(8, "0"),
      relationship: pick(relationships),
    },
    address: `${pick(streets)}, ${int(1, 80)}-${int(1, 180)}`,
    notes: `${SEED_TAG}: Бодит мэт тест өвчтөн #${index}`,
    universityId: category === "student" ? `NUM${String(190000 + index)}` : undefined,
    userId,
    registeredBy,
    status: "active",
    profileCompletedAt: DateTime.now().minus({ days: int(0, 35) }).toJSDate(),
  };
}

function makeVitals(patient: any, visit: any, recordedBy: any, diagnosisCase: any) {
  const height = patient.gender === "female" ? round(154 + random() * 18, 1) : round(164 + random() * 20, 1);
  const weight = patient.gender === "female" ? round(48 + random() * 34, 1) : round(58 + random() * 42, 1);
  const pressureHigh = diagnosisCase.icdCode === "I10";
  const fever = diagnosisCase.icdCode === "J06.9" && chance(0.35);
  const glucose = patient.chronicConditions?.includes("Чихрийн шижин II");
  const hm = height / 100;

  return {
    visitId: visit._id,
    patientId: patient._id,
    recordedBy,
    temperature: round(fever ? 37.5 + random() * 1.3 : 36.2 + random() * 0.7, 1),
    bloodPressureSystolic: pressureHigh ? int(142, 168) : int(104, 132),
    bloodPressureDiastolic: pressureHigh ? int(88, 104) : int(64, 84),
    heartRate: fever ? int(88, 112) : int(62, 92),
    respiratoryRate: int(14, 21),
    oxygenSaturation: int(96, 99),
    weight,
    height,
    painScore: int(0, diagnosisCase.severity === "moderate" ? 7 : 4),
    bloodGlucose: glucose ? round(6.8 + random() * 3.2, 1) : chance(0.18) ? round(4.4 + random() * 2.2, 1) : undefined,
    bmi: round(weight / (hm * hm), 1),
  };
}

function chooseServiceContext(services: any[], resources: any[]) {
  const service = pick(services);
  const resourceCandidates = resources.filter((resource) =>
    (resource.serviceIds || []).some((serviceId: any) => serviceId.toString() === service._id.toString())
  );
  const resource = pick(resourceCandidates.length ? resourceCandidates : resources);
  const staffId = resource.staffId || pick(service.assignedStaffIds || []);
  return { service, resource, staffId };
}

function buildAppointment(patient: any, context: any, day: DateTime, status: string, index: number, createdBy: any) {
  const time = pick(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]);
  const scheduledStart = hospitalDateTime(day, time);
  const duration = context.resource.defaultDurationMinutes || context.service.defaultDurationMinutes || 30;
  const buffer = context.resource.defaultBufferMinutes ?? context.service.defaultBufferMinutes ?? 0;
  const scheduledEnd = scheduledStart.plus({ minutes: duration });
  const blockedUntil = scheduledEnd.plus({ minutes: buffer });
  const isDoctor = context.resource.type === "doctor";
  const isNurse = context.service.requiresNurse;
  const complaintCase = pick(cases);

  return {
    patientId: patient._id,
    doctorId: isDoctor ? context.resource.staffId : undefined,
    nurseId: isNurse ? context.staffId : undefined,
    assignedStaffId: !isDoctor ? context.staffId : undefined,
    serviceId: context.service._id,
    resourceId: context.resource._id,
    scheduledDate: scheduledStart.set({ hour: 12, minute: 0 }).toJSDate(),
    scheduledTime: time,
    duration,
    durationMinutes: duration,
    bufferMinutes: buffer,
    scheduledStart: scheduledStart.toJSDate(),
    scheduledEnd: scheduledEnd.toJSDate(),
    blockedUntil: blockedUntil.toJSDate(),
    appointmentKind: context.service.category === "consultation" ? "consultation" : context.service.category,
    type: chance(0.14) ? "walk_in" : "scheduled",
    status,
    queueNumber: index + 1,
    chiefComplaint: complaintCase.complaint,
    notes: `${SEED_TAG}: ${status} тест цаг`,
    checkedInAt: ["checked_in", "in_progress", "completed"].includes(status) ? scheduledStart.minus({ minutes: int(5, 20) }).toJSDate() : undefined,
    checkedInBy: ["checked_in", "in_progress", "completed"].includes(status) ? createdBy : undefined,
    cancelledAt: status === "cancelled" ? scheduledStart.minus({ days: int(1, 7) }).toJSDate() : undefined,
    cancelledBy: status === "cancelled" ? createdBy : undefined,
    cancelReason: status === "cancelled" ? pick(["Өвчтөн өөр өдөр сонгохоор болсон", "Эмчийн хуваарь өөрчлөгдсөн", "Үйлчилгээ түр хаагдсан"]) : undefined,
    createdBy,
    diagnosisCase: complaintCase,
  };
}

async function seedBulkData() {
  await mongoose.connect(MONGODB_URI, { autoIndex: false });
  console.log(`Connected: ${MONGODB_URI}`);
  console.log(`Cleaning previous ${SEED_TAG} data...`);
  await cleanPreviousSeed();

  console.log("Creating staff, services and resources...");
  const setup = await createStaffAndServices();
  const createdBy = setup.staffUsers[0]._id;
  const nurseUserIds = setup.staff
    .filter((staff) => staff.staffType === "nurse")
    .map((staff) => staff.userId);
  const doctorStaffIds = setup.staff
    .filter((staff) => staff.staffType === "doctor")
    .map((staff) => staff._id);

  console.log(`Creating ${PATIENT_COUNT} patients...`);
  const patientUsers = [];
  const linkedUserCount = 220;
  for (let index = 1; index <= linkedUserCount; index += 1) {
    const gender = chance(0.53) ? "female" : "male";
    patientUsers.push({
      phone: String(85000000 + index).padStart(8, "0"),
      email: `patient${String(index).padStart(3, "0")}@bulk-test.num.edu.mn`,
      password: encryptPassword(PASSWORD),
      firstname: gender === "female" ? pick(femaleFirstNames) : pick(maleFirstNames),
      lastname: pick(lastNames),
      role: "patient",
      gender,
      status: "active",
      phoneVerified: true,
      lastLoginAt: DateTime.now().minus({ days: int(0, 50) }).toJSDate(),
    });
  }
  const insertedUsers = await User.insertMany(patientUsers);
  const patients = [];
  for (let index = 1; index <= PATIENT_COUNT; index += 1) {
    const user = insertedUsers[index - 1];
    const patient = buildPatient(index, user?._id, createdBy);
    if (user) {
      patient.firstname = user.firstname;
      patient.lastname = user.lastname;
      patient.gender = user.gender;
      patient.email = user.email;
      patient.phone = user.phone;
    }
    patients.push(patient);
  }
  const insertedPatients = await Patient.insertMany(patients);

  console.log("Creating appointments, visits, vitals, diagnoses and prescriptions...");
  const appointments: any[] = [];
  const appointmentMeta: any[] = [];

  insertedPatients.forEach((patient, patientIndex) => {
    const appointmentCount = 1 + (chance(0.58) ? 1 : 0) + (chance(0.25) ? 1 : 0);
    for (let attempt = 0; attempt < appointmentCount; attempt += 1) {
      const isPast = attempt === 0 ? chance(0.72) : chance(0.48);
      const day = isPast ? randomWorkday(-45, -1) : randomWorkday(0, 60);
      const status = isPast
        ? pick(["completed", "completed", "completed", "completed", "no_show", "cancelled"])
        : pick(["scheduled", "scheduled", "scheduled", "scheduled", "scheduled", "cancelled"]);
      const context = chooseServiceContext(setup.services, setup.resources);
      const appointment = buildAppointment(patient, context, day, status, patientIndex + attempt, createdBy);
      appointments.push(appointment);
      appointmentMeta.push({ patient, appointment, context });
    }

    if (chance(0.22)) {
      const context = chooseServiceContext(setup.services.filter((service) => service.category === "consultation"), setup.resources);
      const day = randomWorkday(-60, -46);
      const appointment = buildAppointment(patient, context, day, "completed", patientIndex + 1000, createdBy);
      appointments.push(appointment);
      appointmentMeta.push({ patient, appointment, context });
    }
  });

  const insertedAppointments = await Appointment.insertMany(appointments.map(({ diagnosisCase, ...appointment }) => appointment));

  const visits: any[] = [];
  const visitMeta: any[] = [];
  insertedAppointments.forEach((appointment, index) => {
    const original = appointmentMeta[index];
    if (appointment.status !== "completed") return;
    const diagnosisCase = original.appointment.diagnosisCase || pick(cases);
    const doctorId = appointment.doctorId || pick(doctorStaffIds);
    const completedAt = DateTime.fromJSDate(appointment.scheduledEnd).plus({ minutes: int(2, 25) }).toJSDate();
    visits.push({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId,
      visitDate: appointment.scheduledStart,
      visitType: appointment.type === "walk_in" ? "walk_in" : "scheduled",
      status: "completed",
      chiefComplaint: appointment.chiefComplaint,
      historyOfPresentIllness: `${appointment.chiefComplaint}. Зовиур ${int(1, 7)} хоног үргэлжилсэн, өөрөө эмчилгээ хийсэн эсэхийг тодруулсан.`,
      pastMedicalHistory: original.patient.chronicConditions?.length ? original.patient.chronicConditions.join(", ") : "Онцын архаг өвчингүй.",
      familyHistory: chance(0.3) ? "Гэр бүлд даралт ихсэх өвчний өгүүлэмжтэй." : "Онцын удамшлын өгүүлэмжгүй.",
      socialHistory: chance(0.18) ? "Шөнө орой унтах, кофе их хэрэглэх зуршилтай." : "Оюутны хичээл, ажлын ачаалал дунд зэрэг.",
      currentMedications: original.patient.regularMedications?.length ? original.patient.regularMedications.join(", ") : "Тогтмол эмгүй.",
      allergyNotes: original.patient.allergies?.length ? original.patient.allergies.join(", ") : "Эмийн харшлын өгүүлэмжгүй.",
      physicalExamination: "Ерөнхий байдал дунд, ухаан саруул. Зүрх, уушги сонсоход онцын эмгэг авиа үгүй. Хэвлий зөөлөн.",
      assessment: diagnosisCase.diagnosis,
      plan: diagnosisCase.plan,
      doctorAdvice: "Зовиур нэмэгдэх, халууралт үргэлжлэх эсвэл амьсгаадах шинж илэрвэл яаралтай дахин үзүүлэх.",
      followUpDate: chance(0.35) ? DateTime.fromJSDate(completedAt).plus({ days: int(5, 21) }).toJSDate() : undefined,
      notes: `${SEED_TAG}: Үзлэгийн түүх`,
      completedAt,
      createdBy,
      diagnosisCase,
    });
  });

  const insertedVisits = await Visit.insertMany(visits.map(({ diagnosisCase, ...visit }) => visit));

  const vitals: any[] = [];
  const diagnoses: any[] = [];
  const prescriptions: any[] = [];

  insertedVisits.forEach((visit, index) => {
    const source = visits[index];
    const patient = insertedPatients.find((item) => item._id.toString() === visit.patientId.toString());
    const diagnosisCase = source.diagnosisCase || pick(cases);

    vitals.push(makeVitals(patient, visit, pick(nurseUserIds), diagnosisCase));
    diagnoses.push({
      visitId: visit._id,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      icdCode: diagnosisCase.icdCode,
      icdTitle: diagnosisCase.icdTitle,
      icdVersion: "2026-01",
      icdLinearization: "mms",
      icdLanguage: "en",
      name: diagnosisCase.diagnosis,
      description: source.assessment,
      type: "primary",
      severity: diagnosisCase.severity,
      notes: `${SEED_TAG}: Онош`,
      createdBy,
    });

    if (chance(0.68)) {
      prescriptions.push({
        visitId: visit._id,
        patientId: visit.patientId,
        doctorId: visit.doctorId,
        prescriptionNumber: `${SEED_TAG}-RX-${String(index + 1).padStart(5, "0")}`,
        items: diagnosisCase.prescriptions.map((item) => ({ ...item })),
        notes: `${SEED_TAG}: Эмийн жор`,
        status: pick(["active", "dispensed", "dispensed", "dispensed"]),
        createdBy,
      });
    }
  });

  await VitalSign.insertMany(vitals);
  await Diagnosis.insertMany(diagnoses);
  await Prescription.insertMany(prescriptions);

  await AuditLog.create({
    userId: createdBy,
    action: "create",
    resource: "bulk_test_seed",
    resourceId: SEED_TAG,
    details: {
      seedTag: SEED_TAG,
      patients: insertedPatients.length,
      appointments: insertedAppointments.length,
      visits: insertedVisits.length,
      vitals: vitals.length,
      diagnoses: diagnoses.length,
      prescriptions: prescriptions.length,
    },
    ipAddress: "127.0.0.1",
    userAgent: "seedBulkTestData",
  });

  const summary = {
    patients: insertedPatients.length,
    patientUsers: insertedUsers.length,
    staff: setup.staff.length,
    services: setup.services.length,
    resources: setup.resources.length,
    appointments: insertedAppointments.length,
    visits: insertedVisits.length,
    vitals: vitals.length,
    diagnoses: diagnoses.length,
    prescriptions: prescriptions.length,
  };
  console.log(JSON.stringify(summary, null, 2));
}

seedBulkData()
  .then(async () => {
    await mongoose.disconnect();
    console.log("Bulk realistic test data seed completed.");
  })
  .catch(async (error) => {
    console.error("Bulk realistic test data seed failed:", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
