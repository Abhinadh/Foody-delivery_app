const mongoose = require('mongoose');

const RestaurantBookingSchema = new mongoose.Schema({
    restaurantName: String,
    restaurantEmail: String,
    itemId: mongoose.Schema.Types.ObjectId,
    bookingDate: { type: Date, default: Date.now },
    location: String,
    status: { type: String, default: "Pending" },
    estimatedDeliveryTime: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('RestaurantBooking', RestaurantBookingSchema);
