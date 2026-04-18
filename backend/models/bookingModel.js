import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }
});

// prevent double booking
bookingSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

const bookingModel = mongoose.model("bookingModel", bookingSchema);
export default bookingModel;
