import mongoose from "mongoose";

const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true },
  dayOfWeek: { type: String, required: true }, // e.g. "MONDAY"
  startTime: { type: String, required: true }, // "10:00"
  endTime: { type: String, required: true },   // "12:00"
  slotDuration: { type: Number, required: true } // minutes
});

const doctorAvailabilityModel = mongoose.model("doctorAvailabilityModel", doctorAvailabilitySchema);
export default doctorAvailabilityModel;
