const mongoose = require('mongoose');

const DeliveryBoySchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: String,
    assignedRegion: String,
    available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryBoy', DeliveryBoySchema);
