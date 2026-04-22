import mongoose from "mongoose";

const doctorSubscriptionSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  subscriptionActive: { type: Boolean, default: true },
  expiryDate: { type: Date, required: true }, // one month ahead
  createdAt: { type: Date, default: Date.now },
  orderId: { type: String, default: ''},
  orderDate: { type: Date, default: null }
});

export default mongoose.model("DoctorSubscription", doctorSubscriptionSchema);
