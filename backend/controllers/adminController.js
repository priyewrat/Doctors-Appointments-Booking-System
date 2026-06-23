import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import DoctorSubscription, { SubscriptionSetting } from "../models/subscriptionModel.js";
import nodemailer from "nodemailer";

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

    // CHECK IMAGE
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // CHECK REQUIRED FIELDS
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
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // VALIDATE EMAIL
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // VALIDATE PASSWORD
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // CHECK EXISTING EMAIL
    const existingDoctor = await doctorModel.findOne({ email });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // CHECK EXISTING REG NUMBER
    const existingReg = await doctorModel.findOne({ reg_number });

    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: "Registration number already exists",
      });
    }

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CLOUDINARY IMAGE UPLOAD
    const imageUpload = await cloudinary.uploader.upload(
      imageFile.path,
      {
        resource_type: "image",
      }
    );

    const imageUrl = imageUpload.secure_url;

    // PARSE ADDRESS
    let parsedAddress;

    try {

      parsedAddress = JSON.parse(address);

    } catch (err) {

      return res.status(400).json({
        success: false,
        message: "Invalid address format",
      });

    }

    // PREPARE DATA
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
      address: parsedAddress,
      date: Date.now(),
    };

    // SAVE DOCTOR
    const newDoctor = new doctorModel(doctorData);

    await newDoctor.save();

    // SEND RESPONSE FIRST
    res.status(201).json({
      success: true,
      message: "Doctor added successfully",
    });

    // ==========================
    // SEND EMAIL IN BACKGROUND
    // ==========================

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    transporter.sendMail({
      to: email,
      subject: "Welcome to Upchaar - Doctor Portal",
      html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Welcome, ${name}!</h2>

          <p>Your doctor account has been created successfully.</p>

          <div style="background:#f4f4f4;padding:12px;border-radius:6px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>

          <p>Please reset your password after first login.</p>

          <br />

          <p>Regards,</p>
          <p>Upchaar Team</p>
        </body>
      </html>
      `,
    })
    .then(() => {
      console.log("Welcome email sent successfully");
    })
    .catch((error) => {
      console.error("Email sending failed:", error.message);
    });

  } catch (error) {

    console.error("ADD DOCTOR ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
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
