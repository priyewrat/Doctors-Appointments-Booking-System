import express from "express";
import { addDoctor, allDoctors, appointmentsAdmin, loginAdmin, appointmentCancel, adminDashboard, updateSubscriptionAmount, getSubscriptionAmount } from "../controllers/adminController.js";
import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailablity } from "../controllers/doctorController.js";

const adminRouter = express.Router();

adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.post("/login", loginAdmin);
adminRouter.post("/all-doctors", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.post('/appointments', authAdmin, appointmentsAdmin)
adminRouter.post('/cancel-appointment', authAdmin, appointmentCancel)
adminRouter.get('/dashboard', authAdmin, adminDashboard)
adminRouter.post('/update-subscription-amount', authAdmin, updateSubscriptionAmount)
adminRouter.get('/subscription-amount', authAdmin, getSubscriptionAmount)


export default adminRouter;
