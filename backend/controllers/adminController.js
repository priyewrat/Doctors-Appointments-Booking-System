import validator from "validator";
import bycrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import SubscriptionSetting from "../models/subscriptionModel.js";
import DoctorSubscription from "../models/subscriptionModel.js";
import nodemailer from "nodemailer";

// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      city,
      address,
      reg_number,
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !city ||
      !address ||
      !reg_number
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email" });
    }

    // validating strong password
    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: "Password enter a strong password" });
    }

    // Check if email already exists
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    // Check if registration number already exists
    const existingReg = await doctorModel.findOne({ reg_number });
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: "Registration number already exists",
      });
    }

    // hashing doctor
    const salt = await bycrypt.genSalt(10);
    const hashedPassword = await bycrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      password: hashedPassword,
      image: imageUrl,
      speciality,
      degree,
      reg_number,
      experience,
      about,
      city,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };

    // configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    await transporter.sendMail({
      to: email,
      subject: "Welcome to Upchaar - Doctor Portal",
      html: `<!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 40px auto; background: #fff;
                     border: 1px solid #ddd; border-radius: 8px; padding: 20px;
                     box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        h2 { color: #333; }
        p { color: #555; line-height: 1.6; }
        .credentials { background: #f1f1f1; padding: 12px; border-radius: 6px; margin: 15px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome, ${name}!</h2>
        <p>We’re excited to have you join the Upchaar Doctor Portal.</p>
        <p>Here are your login credentials:</p>
        <div class="credentials">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>For security reasons, please reset your password after your first login.</p>
        <p>You can now manage your profile, appointments, and subscriptions through the Upchaar Doctor Panel.</p>
        <p>Regards,<br/>Upchaar Admin Team</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Upchaar. All rights reserved.
        </div>
      </div>
    </body>
  </html>`,
    });

    res
      .status(201)
      .json({ success: true, message: "Doctor added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error adding doctor",
      message: error.message,
    });
  }
};

// API for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.status(200).json({
        success: true,
        message: "Admin logged in successfully",
        token,
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unexpected error during admin login",
      message: error.message,
    });
  }
};

// API to get all doctors list for admin
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.status(200).json({
      success: true,
      message: "Doctors list fetched successfully",
      doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unexpected error during fetching doctors list",
      message: error.message,
    });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    return res.json({ success: true, appointments });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // releasing doctor slot

    const { docId, slotDate, slotTime } = appointmentData;

    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime,
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    return res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});
    const subscriptionSetting = await SubscriptionSetting.findOne({});
    const subscriptions = await DoctorSubscription.find({})
      .populate("doctorId", "name email reg_number image") // pull fields from doctor model
      .sort({ createdAt: -1 });

    let earnings = 0;
    const doctorStats = {}; // store stats keyed by doctorId

    appointments.forEach((item) => {
      const docId = item.docId;

      if (!doctorStats[docId]) {
        doctorStats[docId] = { patients: 0, earnings: 0 };
      }

      // count patients
      doctorStats[docId].patients += 1;

      // add earnings if paid and not cancelled
      if (item.payment && !item.cancelled) {
        earnings += item.amount;
        doctorStats[docId].earnings += item.amount;
      }
    });

    // build per-doctor summary with names
    const doctorSummary = doctors.map((doc) => ({
      doctorId: doc._id,
      name: doc.name,
      image: doc.image,
      email: doc.email,
      reg_number: doc.reg_number,
      available: doc.available,
      totalPatients: doctorStats[doc._id]?.patients || 0,
      totalEarnings: doctorStats[doc._id]?.earnings || 0,
    }));

    const subscriptionRecords = subscriptions
      .filter((sub) => sub.orderId)
      .map((sub) => {
        const now = new Date();
        const status =
          sub.subscriptionActive && sub.expiryDate > now
            ? "Subscribed"
            : "Expired";

        return {
          doctorName: sub.doctorId?.name,
          doctorImage: sub.doctorId?.image,
          doctorEmail: sub.doctorId?.email,
          doctorRegId: sub.doctorId?.reg_number,
          orderId: sub.orderId,
          orderDate: sub.orderDate,
          status,
        };
      });

    const dashData = {
      earnings,
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
      doctorSummary, // <-- array with doctor name, patients, earnings, email, reg_number
      subscriptionAmount: subscriptionSetting?.amount || 399, // <-- added here
      subscriptionRecords,
    };
    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const lockDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const doctor = await doctorModel.findById(docId);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    await doctor.lockByAdmin(); // model forces unavailable
    res.json({ success: true, message: "Doctor locked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const unlockDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const doctor = await doctorModel.findById(docId);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    await doctor.unlockByAdmin(); // model gives control back
    res.json({ success: true, message: "Doctor unlocked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update subscription amount
const updateSubscriptionAmount = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.json({ success: false, message: "Invalid amount" });
    }

    const setting = await SubscriptionSetting.findOneAndUpdate(
      {},
      { amount, updatedAt: new Date() },
      { upsert: true, new: true },
    );

    res.json({
      success: true,
      message: "Subscription amount updated",
      setting,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current subscription amount
const getSubscriptionAmount = async (req, res) => {
  try {
    const setting = await SubscriptionSetting.findOne({});
    res.json({ success: true, amount: setting?.amount || 399 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  lockDoctor,
  unlockDoctor,
  updateSubscriptionAmount,
  getSubscriptionAmount,
};
