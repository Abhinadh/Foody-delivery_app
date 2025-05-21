const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    //number:{type:Number, required:true},//new phone is added
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    restaurantName: { type: String, required: true },
    restaurantEmail: { type: String, required: true },
    location: { type: String, required: true },
    selectedLocation: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }},
    buyerName: { type: String, required: true },
    bookingDate: { type: Date, default: Date.now },
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now },  // Automatically stores the order timestamp
    estimatedDeliveryTime: { type: String }
});

module.exports = mongoose.model("Order", orderSchema);

