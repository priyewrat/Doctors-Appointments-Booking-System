import cron from "node-cron";
import appointmentModel from "../models/appointmentModel.js";
import DoctorSubscription from "../models/subscriptionModel.js"; // this is your DoctorSubscription schema

// --- Appointment Auto-Cancel (after 48 hrs) ---
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    const appointments = await appointmentModel.find({ cancelled: false, isCompleted: false });

    for (const appt of appointments) {
      const apptDateTime = new Date(`${appt.slotDate}T${appt.slotTime}`);
      const expiry = new Date(apptDateTime.getTime() + 48 * 60 * 60 * 1000);

      if (now > expiry) {
        await appointmentModel.findByIdAndUpdate(appt._id, { cancelled: true });
      }
    }
  } catch (err) {
    console.error("Error in appointment auto-cancel cron:", err);
  }
});

// --- Subscription Expiry (after 1 month) ---
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    const subs = await DoctorSubscription.find({ subscriptionActive: true });

    for (const sub of subs) {
      if (sub.expiryDate && now > sub.expiryDate) {
        await DoctorSubscription.findByIdAndUpdate(sub._id, { subscriptionActive: false });
      }
    }
  } catch (err) {
    console.error("Error in subscription expiry cron:", err);
  }
});
