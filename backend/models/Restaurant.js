const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    address: String,
    phone: String,
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    approved: { type: Boolean, default: false }, // Admin approval required
    rating: { type: Number, default: 3 } // Default rating set to 3
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
