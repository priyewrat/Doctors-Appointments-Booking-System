import cron from "node-cron";
import appointmentModel from "../models/appointmentModel.js";

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  const now = new Date();

  // Find all active appointments
  const appointments = await appointmentModel.find({
    cancelled: false,
    isCompleted: false,
  });

  for (const appt of appointments) {
    const apptDateTime = new Date(`${appt.slotDate}T${appt.slotTime}`);
    const expiry = new Date(apptDateTime.getTime() + 48 * 60 * 60 * 1000);

    if (now > expiry) {
      await appointmentModel.findByIdAndUpdate(appt._id, { cancelled: true });
      console.log(`Auto-cancelled appointment ${appt._id}`);
    }
  }
});
