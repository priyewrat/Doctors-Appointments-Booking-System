import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import bookingModel from "../models/bookingModel.js";
import razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already exists" });
    }

    if (!name || !password || !email) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "enter a valid email" });
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: "enter a strong password" });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });

    // sending welcome email to user using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Welcome to Upchaar!",
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
          .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome, ${user.name}!</h2>
          <p>Thank you for registering with Upchaar. We’re excited to have you on board.</p>
          <p>You can now book appointments, manage your profile, and explore our services.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Upchaar. All rights reserved.
          </div>
        </div>
      </body>
    </html>`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      return res.json({ success: true, token });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to update user Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return json({ success: false, message: "Data Missing" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // upload image to clodinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { docId, slotDate, slotTime } = req.body;

    // 1. Check doctor availability
    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData || !docData.available) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    // 2. Prevent duplicate appointment for same user/doctor/date
    const existingAppointment = await appointmentModel.findOne({
      userId,
      docId,
      slotDate,
      cancelled: { $ne: true },
    });
    if (existingAppointment) {
      return res.json({
        success: false,
        message: "You already have an appointment with this doctor on this day",
      });
    }

    // 3. Prevent double booking of the same slot
    const existingBooking = await bookingModel.findOne({
      doctorId: docId,
      date: slotDate,
      startTime: slotTime,
    });
    if (existingBooking) {
      return res.json({ success: false, message: "Slot not available" });
    }

    // 4. Create booking entry
    await bookingModel.create({
      doctorId: docId,
      date: slotDate,
      startTime: slotTime,
    });

    // 5. Fetch user data
    const userData = await userModel.findById(userId).select("-password");

    // 6. Create full appointment record
    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
      cancelled: false,
      payment: false,
      isCompleted: false,
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to get user appointments for frontend my-appointments page
const listAppointments = async (req, res) => {
  try {
    const userId = req.userId;
    const appointments = await appointmentModel.find({ userId });

    res.json({ success: true, appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // verify appointment user
    if (appointmentData.userId.toString() !== userId) {
      return res.status(401).json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    // releasing doctor slot
    const { docId, slotDate, slotTime } = appointmentData;

    // remove booking entry so slot becomes available again
    await bookingModel.deleteOne({
      doctorId: docId,
      date: slotDate,
      startTime: slotTime
    });

    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked || {};
    if (!Array.isArray(slots_booked[slotDate])) {
      slots_booked[slotDate] = [];
    }
    slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e !== slotTime);
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    return res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }

    // creating options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };

    //creation of an order
    const order = await razorpayInstance.orders.create(options);

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
        orderId: orderInfo.id,
        orderDate: new Date(),          
      });
      res.json({ success: true, message: "Payment Successful" });
      
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/user/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: "If account exists, reset link sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // configure nodemailer (or SendGrid, etc.)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      html: `<!DOCTYPE html>
            <html>
             <head>
               <style>
                 body {
                   font-family: Arial, sans-serif;
                   background-color: #f9f9f9;
                   margin: 0;
                   padding: 0;
                 }
                 .container {
                   max-width: 600px;
                   margin: 40px auto;
                   background: #fff;
                   border: 1px solid #ddd;
                   border-radius: 8px;
                   padding: 20px;
                   box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                 }
                 h2 {
                   color: #333;
                   margin-bottom: 20px;
                 }
                 p {
                   color: #555;
                   line-height: 1.6;
                 }
                 a.button {
                   display: inline-block;
                   margin-top: 15px;
                   padding: 12px 20px;
                   background-color: #007BFF;
                   color: #fff !important;
                   text-decoration: none;
                   border-radius: 5px;
                   font-weight: bold;
                   transition: background-color 0.3s ease;
                 }
                 a.button:hover {
                   background-color: #0056b3;
                 }
                 .footer {
                   margin-top: 30px;
                   font-size: 12px;
                   color: #999;
                   text-align: center;
                 }
               </style>
             </head>
             <body>
               <div class="container">
                 <h2>Dear ${user.name},</h2>
                 <p>We received a request to reset your password. Click the button below to proceed:</p>
                 <p><a href="${resetUrl}" class="button">Reset Password</a></p>
                 <p>If you did not request this, please ignore this email.</p>
                 <div class="footer">
                   &copy; ${new Date().getFullYear()} Upchaar. All rights reserved.
                 </div>
               </div>
             </body>
            </html>
            `,
    });

    res.json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/user/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await userModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  forgotPassword,
  resetPassword,
};
