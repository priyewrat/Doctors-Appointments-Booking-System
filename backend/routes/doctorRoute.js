import express from 'express'
import { doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile, forgotPassword, resetPassword, getAvailableSlots, addAvailability, updateAvailability, deleteAvailability, getAvailability, paymentRazorpaySubscription, verifyRazorpaySubscription } from '../controllers/doctorController.js'
import authDoctor from '../middlewares/authDoctor.js'

const doctorRouter = express.Router()

doctorRouter.get('/list', doctorList)
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor)
doctorRouter.post('/appointment-complete', authDoctor, appointmentComplete)
doctorRouter.post('/appointment-cancel', authDoctor, appointmentCancel)
doctorRouter.get('/dashboard', authDoctor, doctorDashboard)
doctorRouter.get('/profile', authDoctor, doctorProfile)
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile)
doctorRouter.post('/forgot-password', forgotPassword)
doctorRouter.post('/reset-password/:dToken', resetPassword)
doctorRouter.get('/:id/availability', getAvailability);
doctorRouter.get('/:id/slots', getAvailableSlots)
doctorRouter.post('/:id/availability', addAvailability)
doctorRouter.put('/:id/availability/:availabilityId', updateAvailability)
doctorRouter.delete('/:id/availability/:availabilityId', deleteAvailability)
doctorRouter.post("/subscription/payment", paymentRazorpaySubscription);
doctorRouter.post("/subscription/verify", verifyRazorpaySubscription);

export default doctorRouter