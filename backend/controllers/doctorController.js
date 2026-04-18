import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import doctorAvailabilityModel from "../models/DoctorAvailabilityModel.js";
import bookingModel from "../models/bookingModel.js";

function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, h, m);
  date.setMinutes(date.getMinutes() + mins);
  return date.toTimeString().slice(0,5); // "HH:MM"
}

const  changeAvailablity = async (req, res) => {
  try {
    const { docId, status } = req.body;
    const statusBool = status === true || status === "true";

    const updateFields = { available: statusBool };

    // Rule:
    // If admin sets doctor unavailable → lock them
    // If admin sets doctor available → unlock them
    if (statusBool === false) {
      updateFields.adminOverride = true;   // doctor locked
    } else {
      updateFields.adminOverride = false;  // doctor regains control
    }

    await doctorModel.findByIdAndUpdate(docId, updateFields, { runValidators: false });

    res.json({ success: true, message: "Availability updated by admin" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//API for doctor login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
      res.json({ success: true, message: "Login Successful", token });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.user.id;
    const appointments = await appointmentModel.find({ docId });

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to mark appointment for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const docId = req.user.id;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      res.json({ success: true, message: "Appointment Completed" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Marking Appointment Failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const docId = req.user.id;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      res.json({ success: true, message: "Appointment Cancelled" });
    } else {
      res.status(404).json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.user.id;

    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;

    appointments.map((item) => {
      if (item.isCompleted && !item.cancelled) {
        earnings += item.amount;
      }
    });

    let patients = [];

    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get doctor profile for doctor panel
const doctorProfile = async (req, res) => {
  try {
    const docId = req.user.id;
    const profileData = await doctorModel.findById(docId).select(["-password"]);
    res.json({ success: true, profileData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to update doctor profile data from Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.user.id;
    const { fees, address, available } = req.body;

    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const updateFields = {};
    if (typeof fees !== "undefined") updateFields.fees = fees;
    if (typeof address !== "undefined") updateFields.address = address;

    if (doctor.adminOverride && typeof available !== "undefined") {
      return res.status(403).json({
        success: false,
        message: "Admin has locked your availability. You cannot change it."
      });
    }

    if (!doctor.adminOverride && typeof available !== "undefined") {
      updateFields.available = available;
    }

    await doctorModel.findByIdAndUpdate(docId, updateFields, { returnDocument: 'after' });

    res.json({ success: true, message: "Profile Updated Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/doctor/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const doctor = await doctorModel.findOne({ email });

    // Always return generic message for security
    if (!doctor) {
      return res.json({
        success: true,
        message: "If account exists, reset link sent.",
      });
    }

    const dToken = crypto.randomBytes(32).toString("hex");

    // Instead of doctor.save() (which triggers full validation),
    // use updateOne to only update reset fields
    await doctorModel.updateOne(
      { email },
      {
        $set: {
          resetToken: dToken,
          resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
        },
      }
    );

    const resetUrl = `${process.env.ADMIN_DASHBOARD_URL}/reset-password/${dToken}`;

    // configure nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: doctor.email,
      subject: "Password Reset",
      html: `<!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f9f9f9; }
              .container { max-width: 600px; margin: 40px auto; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
              h2 { color: #333; margin-bottom: 20px; }
              p { color: #555; line-height: 1.6; }
              a.button { display: inline-block; margin-top: 15px; padding: 12px 20px; background-color: #007BFF; color: #fff !important; text-decoration: none; border-radius: 5px; font-weight: bold; transition: background-color 0.3s ease; }
              a.button:hover { background-color: #0056b3; }
              .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Dear ${doctor.name || "Doctor"},</h2>
              <p>We received a request to reset your password. Click the button below to proceed:</p>
              <p><a href="${resetUrl}" class="button">Reset Password</a></p>
              <p>If you did not request this, please ignore this email.</p>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Upchaar. All rights reserved.
              </div>
            </div>
          </body>
        </html>`,
    });

    res.json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// POST /api/doctor/reset-password/:dToken
const resetPassword = async (req, res) => {
  try {
    const { dToken } = req.params;
    const { password } = req.body;

    const doctor = await doctorModel.findOne({
      resetToken: dToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!doctor) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await doctorModel.updateOne(
      { _id: doctor._id },
      {
        $set: {
          password: hashedPassword,
          resetToken: undefined,
          resetTokenExpiry: undefined,
        },
      }
    );

    res.json({
      success: true,
      message: "Password reset successful. You can now log in.",
      doctorId: doctor._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailableSlots = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // "2026-04-20"

  const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const availabilities = await doctorAvailabilityModel.find({ doctorId: id, dayOfWeek: dayName });
  const bookings = await bookingModel.find({ doctorId: id, date });

  const bookedTimes = bookings.map(b => b.startTime);
  let slots = [];

  availabilities.forEach(avail => {
    let current = avail.startTime;
    while (current < avail.endTime) {
      if (!bookedTimes.includes(current)) {
        slots.push(current);
      }
      current = addMinutes(current, avail.slotDuration);
    }
  });

  res.json({ slots });
};


// GET /api/doctor/:id/availability
const getAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const availabilities = await doctorAvailabilityModel.find({ doctorId });
    res.json({ success: true, availabilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/doctor/:id/availability
const addAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, slotDuration } = req.body;
    const doctorId = req.params.id;

    // Check if an availability already exists with same day and overlapping time
    const existing = await doctorAvailabilityModel.findOne({
      doctorId,
      dayOfWeek,
      startTime,
      endTime
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Availability already exists for this time range"
      });
    }

    await doctorAvailabilityModel.create({
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration: Number(slotDuration),
    });

    const availabilities = await doctorAvailabilityModel.find({ doctorId });
    res.json({ success: true, availabilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/doctor/:id/availability/:availabilityId
const updateAvailability = async (req, res) => {
  try {
    const { id, availabilityId } = req.params;
    const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

    await doctorAvailabilityModel.findByIdAndUpdate(
      availabilityId,
      { dayOfWeek, startTime, endTime, slotDuration: Number(slotDuration) },
      { new: true }
    );

    const availabilities = await doctorAvailabilityModel.find({ doctorId: id });
    res.json({ success: true, availabilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/doctor/:id/availability/:availabilityId
const deleteAvailability = async (req, res) => {
  try {
    const { id, availabilityId } = req.params;
    await doctorAvailabilityModel.findByIdAndDelete(availabilityId);

    const availabilities = await doctorAvailabilityModel.find({ doctorId: id });
    res.json({ success: true, availabilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  changeAvailablity,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  forgotPassword,
  resetPassword,
  getAvailableSlots,
  addAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailability
};
