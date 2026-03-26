import mongoose from "mongoose";
import { User } from "./models/userModel";
import { Department } from "./models/departmentModel";
import { Staff } from "./models/staffModel";
import { encryptPassword } from "./utils/auth";
import { MONGODB_URI } from "./utils/constants";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // ─── Departments ───
  const departments = [
    { name: "Ерөнхий үзлэг", code: "GENERAL", description: "Ерөнхий эмнэлгийн үзлэг" },
    { name: "Шүдний эмнэлэг", code: "DENTAL", description: "Шүдний эмчлэгээ" },
    { name: "Дотрын эмгэг", code: "INTERNAL", description: "Дотрын өвчин" },
    { name: "Нүдний эмнэлэг", code: "OPHTHAL", description: "Нүдний үзлэг, эмчилгээ" },
    { name: "Мэс засал", code: "SURGERY", description: "Мэс заслын тасаг" },
    { name: "Сэтгэцийн эрүүл мэнд", code: "MENTAL", description: "Сэтгэл зүйн зөвлөгөө" },
  ];

  for (const dept of departments) {
    await Department.findOneAndUpdate({ code: dept.code }, dept, {
      upsert: true,
      new: true,
    });
  }
  console.log(`✅ ${departments.length} departments seeded`);

  // ─── Superadmin ───
  const adminPhone = "99000001";
  let adminUser = await User.findOne({ phone: adminPhone });
  if (!adminUser) {
    adminUser = await User.create({
      phone: adminPhone,
      password: encryptPassword("admin123"),
      firstname: "Систем",
      lastname: "Админ",
      role: "superadmin",
      status: "active",
      email: "admin@num.edu.mn",
    });
    console.log("✅ Superadmin created: 99000001 / admin123");
  } else {
    console.log("ℹ️  Superadmin already exists");
  }

  // ─── Sample Doctor ───
  const doctorPhone = "99000002";
  let doctorUser = await User.findOne({ phone: doctorPhone });
  if (!doctorUser) {
    doctorUser = await User.create({
      phone: doctorPhone,
      password: encryptPassword("doctor123"),
      firstname: "Болд",
      lastname: "Батбаяр",
      role: "doctor",
      status: "active",
      email: "bold@num.edu.mn",
      gender: "male",
    });

    const generalDept = await Department.findOne({ code: "GENERAL" });
    await Staff.create({
      userId: doctorUser._id,
      departmentId: generalDept?._id,
      staffType: "doctor",
      specialization: "Ерөнхий эмч",
      title: "Эмч",
      isAvailable: true,
      maxDailyAppointments: 20,
      status: "active",
    });
    console.log("✅ Sample doctor created: 99000002 / doctor123");
  }

  // ─── Sample Data Operator ───
  const operatorPhone = "99000003";
  let operatorUser = await User.findOne({ phone: operatorPhone });
  if (!operatorUser) {
    operatorUser = await User.create({
      phone: operatorPhone,
      password: encryptPassword("operator123"),
      firstname: "Сарантуяа",
      lastname: "Ганбат",
      role: "data_operator",
      status: "active",
      email: "sarantuya@num.edu.mn",
      gender: "female",
    });

    await Staff.create({
      userId: operatorUser._id,
      staffType: "data_operator",
      title: "Бүртгэлийн ажилтан",
      isAvailable: true,
      status: "active",
    });
    console.log("✅ Sample data operator created: 99000003 / operator123");
  }

  // ─── Sample Patient User ───
  const patientPhone = "99000004";
  let patientUser = await User.findOne({ phone: patientPhone });
  if (!patientUser) {
    patientUser = await User.create({
      phone: patientPhone,
      password: encryptPassword("patient123"),
      firstname: "Тэмүүлэн",
      lastname: "Энхболд",
      role: "patient",
      status: "active",
      gender: "male",
    });
    console.log("✅ Sample patient user created: 99000004 / patient123");
  }

  console.log("\n🎉 Seed completed!");
  console.log("─────────────────────────────────────");
  console.log("Superadmin:     99000001 / admin123");
  console.log("Doctor:         99000002 / doctor123");
  console.log("Data Operator:  99000003 / operator123");
  console.log("Patient:        99000004 / patient123");
  console.log("─────────────────────────────────────");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
