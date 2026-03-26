import cron from "node-cron";

export function scheduleCronJobs() {
  // Daily report at 22:00 Ulaanbaatar time
  cron.schedule(
    "0 22 * * *",
    () => {
      console.log(
        "[CRON] Daily report job running:",
        new Date().toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })
      );
      // TODO: import and call dailyReport()
    },
    { timezone: "Asia/Ulaanbaatar" }
  );

  // Appointment reminder at 08:00 daily
  cron.schedule(
    "0 8 * * *",
    () => {
      console.log(
        "[CRON] Appointment reminder job running:",
        new Date().toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })
      );
      // TODO: import and call sendAppointmentReminders()
    },
    { timezone: "Asia/Ulaanbaatar" }
  );

  console.log("✅ Cron jobs scheduled");
}
