import mongoose from "mongoose";
import { User } from "./models/userModel";
import { MONGODB_URI } from "./utils/constants";
import { encryptPassword } from "./utils/auth";

async function main() {
  const phone = "99176040";
  const normalizedPhone = phone.replace(/\s+/g, "").trim();
  const newPassword = "Test!123";

  await mongoose.connect(MONGODB_URI, {
    autoIndex: false,
  });

  const user = await User.findOne({ phone: normalizedPhone, role: "doctor" });
  if (!user) {
    console.error(`Doctor with phone ${normalizedPhone} not found.`);
    process.exit(1);
  }

  user.password = encryptPassword(newPassword);
  await user.save();

  console.log(`Updated password for doctor ${normalizedPhone} to ${newPassword}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Emergency password reset failed:", error);
  process.exit(1);
});
