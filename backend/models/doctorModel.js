import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    image: {type: String, required: true},
    speciality: {type: String, required: true},
    degree: {type: String, required: true},
    reg_number: {type: String, required: true, unique: true},
    experience: {type: String, required: true},
    about: {type: String, required: true},
    available: {type: Boolean, default: true},       // doctor’s own status
    adminOverride: {type: Boolean, default: false},  // true if admin locked unavailable
    fees: {type: Number, required: true},
    city: {type: String, required: true},
    address: {type: Object, required: true},
    date: {type: Number, required: true},
    slots_booked: {type: Object, default: {}},
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
}, {minimize: false});

// Doctor tries to change availability
doctorSchema.methods.setAvailability = async function (status) {
    if (this.adminOverride) {
        throw new Error("Admin has locked your availability. You cannot change it.");
    }
    this.available = status;
    await this.save();
    return this;
};

// Admin locks doctor (forces unavailable)
doctorSchema.methods.lockByAdmin = async function () {
    this.adminOverride = true;
    this.available = false; // force unavailable
    await this.save();
    return this;
};

// Admin unlocks doctor (gives control back)
doctorSchema.methods.unlockByAdmin = async function () {
    this.adminOverride = false;
    await this.save();
    return this;
};

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema);
export default doctorModel;
