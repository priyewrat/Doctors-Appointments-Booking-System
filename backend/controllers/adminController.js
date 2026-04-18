import validator from "validator";
import bycrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";

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

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();
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

    const dashData = {
      earnings,
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
      doctorSummary, // <-- array with doctor name, patients, earnings, email, reg_number
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
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

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
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    await doctor.unlockByAdmin(); // model gives control back
    res.json({ success: true, message: "Doctor unlocked" });
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
};
