const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    address: String,
    phone: String,
    location: {
        lat: Number,
        lng: Number
    },
    approved: { type: Boolean, default: false } // Admin approval required
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
