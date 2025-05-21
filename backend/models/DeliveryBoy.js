const mongoose = require('mongoose');

const DeliveryBoySchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: String,
    assignedRegions: [String],  // Changed to an array to support multiple regions
    available: { type: Boolean, default: true },
    assignmentsCount: { type: Number, default: 0 },
    salary: { type: Number, default: 0 }, // Track number of active orders
    currentOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }] // Track current orders
}, { timestamps: true });

module.exports = mongoose.model('DeliveryBoy', DeliveryBoySchema);
