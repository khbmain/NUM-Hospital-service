// @ts-nocheck
import {
  connectDb,
  disconnectDb,
  countSummary,
  plusDays,
  upsertAppointment,
  upsertDepartment,
  upsertPatient,
  upsertResource,
  upsertService,
  upsertStaff,
  upsertUser,
} from "./seedSupport";

async function seed() {
  await connectDb();
  console.log("Connected to MongoDB");

  const departments = {
    general: await upsertDepartment({
      code: "GENERAL",
      name: "Ерөнхий үзлэг",
      description: "Анхан шатны үзлэг, өдөр тутмын хяналт",
    }),
    internal: await upsertDepartment({
      code: "INTERNAL",
      name: "Дотрын эмгэг",
      description: "Дотрын өвчний үзлэг, хяналт",
    }),
    rehab: await upsertDepartment({
      code: "REHAB",
      name: "Сэргээн засах",
      description: "Физиотерапи, дусал, төхөөрөмжийн үйлчилгээ",
    }),
  };

  const users = {
    superadmin: await upsertUser({
      phone: "99000001",
      password: "admin123",
      firstname: "Систем",
      lastname: "Админ",
      role: "superadmin",
      email: "admin@num.edu.mn",
      gender: "male",
    }),
    doctor: await upsertUser({
      phone: "99000002",
      password: "doctor123",
      firstname: "Болд",
      lastname: "Батбаяр",
      role: "doctor",
      email: "doctor@num.edu.mn",
      gender: "male",
    }),
    nurse: await upsertUser({
      phone: "99000005",
      password: "nurse123",
      firstname: "Оюунаа",
      lastname: "Дэлгэр",
      role: "nurse",
      email: "nurse@num.edu.mn",
      gender: "female",
    }),
    operator: await upsertUser({
      phone: "99000003",
      password: "operator123",
      firstname: "Сарантуяа",
      lastname: "Ганбат",
      role: "data_operator",
      email: "operator@num.edu.mn",
      gender: "female",
    }),
    patient: await upsertUser({
      phone: "99000004",
      password: "patient123",
      firstname: "Тэмүүлэн",
      lastname: "Энхболд",
      role: "patient",
      email: "patient@num.edu.mn",
      gender: "male",
      birthdate: new Date("2002-05-13"),
    }),
  };

  const staff = {
    doctor: await upsertStaff({
      userId: users.doctor._id,
      departmentId: departments.general._id,
      staffType: "doctor",
      specialization: "Ерөнхий эмч",
      licenseNumber: "DOC-SEED-001",
      title: "Эмч",
      bio: "Анхан шатны үзлэг, follow-up хяналт хариуцна.",
      maxDailyAppointments: 20,
    }),
    nurse: await upsertStaff({
      userId: users.nurse._id,
      departmentId: departments.rehab._id,
      staffType: "nurse",
      title: "Сувилагч",
      bio: "Дусал, тарилга, урьдчилсан хэмжилт хариуцна.",
      maxDailyAppointments: 28,
    }),
    operator: await upsertStaff({
      userId: users.operator._id,
      departmentId: departments.general._id,
      staffType: "data_operator",
      title: "Бүртгэлийн ажилтан",
      bio: "Өвчтөн бүртгэл, цаг товлолт хариуцна.",
      maxDailyAppointments: 40,
    }),
  };

  const services = {
    consult: await upsertService({
      code: "CONSULT_GENERAL",
      name: "Ерөнхий эмчийн үзлэг",
      category: "consultation",
      description: "Анхан үзлэг болон follow-up",
      defaultDurationMinutes: 20,
      defaultBufferMinutes: 5,
      requiresDoctor: true,
    }),
    injection: await upsertService({
      code: "NURSE_INJECTION",
      name: "Сувилагчийн тариа",
      category: "injection",
      description: "Төлөвлөгөөт тариа, богино ажилбар",
      defaultDurationMinutes: 15,
      requiresNurse: true,
    }),
    infusion: await upsertService({
      code: "IV_INFUSION",
      name: "Дусал",
      category: "infusion",
      description: "Дуслын өрөөнд хийх үйлчилгээ",
      defaultDurationMinutes: 90,
      defaultBufferMinutes: 0,
      requiresNurse: true,
    }),
    massage: await upsertService({
      code: "MASSAGE_CHAIR",
      name: "Массажны сандал",
      category: "device",
      description: "Төхөөрөмжийн үйлчилгээ",
      defaultDurationMinutes: 30,
      defaultBufferMinutes: 10,
      requiresDevice: true,
    }),
    irradiation: await upsertService({
      code: "IRRADIATION",
      name: "Шарлагын аппарат",
      category: "device",
      description: "Шарлагын төхөөрөмжийн үйлчилгээ",
      defaultDurationMinutes: 20,
      defaultBufferMinutes: 10,
      requiresDevice: true,
    }),
  };

  const resources = {
    doctor: await upsertResource({
      name: "Ерөнхий эмчийн кабинет 101",
      type: "doctor",
      category: "consultation",
      staffId: staff.doctor._id,
      serviceIds: [services.consult._id],
      room: "101",
      capacity: 1,
      slotIntervalMinutes: 25,
      defaultDurationMinutes: 20,
      defaultBufferMinutes: 5,
    }),
    injectionRoom: await upsertResource({
      name: "Тарилгын өрөө 201",
      type: "room",
      category: "injection",
      serviceIds: [services.injection._id],
      room: "201",
      capacity: 1,
      slotIntervalMinutes: 15,
      defaultDurationMinutes: 15,
      defaultBufferMinutes: 0,
    }),
    infusionRoom: await upsertResource({
      name: "Дуслын өрөө",
      type: "capacity_room",
      category: "infusion",
      serviceIds: [services.infusion._id],
      room: "301",
      capacity: 8,
      slotIntervalMinutes: 30,
      defaultDurationMinutes: 90,
      defaultBufferMinutes: 0,
    }),
    massageChair: await upsertResource({
      name: "Массажны сандал 1",
      type: "device",
      category: "massage",
      serviceIds: [services.massage._id],
      room: "302",
      capacity: 1,
      slotIntervalMinutes: 40,
      defaultDurationMinutes: 30,
      defaultBufferMinutes: 10,
    }),
    irradiationDevice: await upsertResource({
      name: "Шарлагын аппарат 1",
      type: "device",
      category: "irradiation",
      serviceIds: [services.irradiation._id],
      room: "303",
      capacity: 1,
      slotIntervalMinutes: 30,
      defaultDurationMinutes: 20,
      defaultBufferMinutes: 10,
    }),
  };

  const patient = await upsertPatient({
    registrationNumber: "NUM-20260424-0001",
    firstname: users.patient.firstname,
    lastname: users.patient.lastname,
    phone: users.patient.phone,
    email: users.patient.email,
    gender: "male",
    birthdate: new Date("2002-05-13"),
    category: "student",
    bloodType: "A+",
    allergies: ["Пенициллин"],
    chronicConditions: ["Харшлын ринит"],
    regularMedications: ["Cetirizine 10mg"],
    medicalWarnings: ["Пенициллинд харшилтай"],
    address: "Улаанбаатар хот, БЗД",
    notes: "Baseline patient profile for patient portal and booking flow.",
    universityId: "NUM20D1234",
    emergencyContact: {
      name: "Энхтуяа",
      phone: "99119911",
      relationship: "Ээж",
    },
    registeredBy: users.operator._id,
    userId: users.patient._id,
  });

  const scheduledStart = plusDays(new Date(), 1, 10, 0);
  const scheduledEnd = plusDays(new Date(), 1, 10, 20);
  const blockedUntil = plusDays(new Date(), 1, 10, 25);

  await upsertAppointment({
    patientId: patient._id,
    doctorId: staff.doctor._id,
    serviceId: services.consult._id,
    resourceId: resources.doctor._id,
    departmentId: departments.general._id,
    scheduledDate: scheduledStart,
    scheduledTime: "10:00",
    scheduledStart,
    scheduledEnd,
    blockedUntil,
    durationMinutes: 20,
    bufferMinutes: 5,
    appointmentKind: "consultation",
    type: "scheduled",
    status: "scheduled",
    queueNumber: 1,
    chiefComplaint: "Улирлын харшил сэдэрсэн",
    notes: "Baseline appointment for smoke testing patient/admin flow.",
    createdBy: users.operator._id,
  });

  const summary = await countSummary();
  console.log("Base seed completed");
  console.log(summary);
  console.log("Logins:");
  console.log("  superadmin  99000001 / admin123");
  console.log("  doctor      99000002 / doctor123");
  console.log("  nurse       99000005 / nurse123");
  console.log("  operator    99000003 / operator123");
  console.log("  patient     99000004 / patient123");

  await disconnectDb();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await disconnectDb();
  process.exit(1);
});
