const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema({
    restaurantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Restaurant", 
        required: true 
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: Buffer },
    stockCount: { type: Number, required: true, default: 0 },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 3 }  // Added rating field with default value
}, { timestamps: true });

module.exports = mongoose.model("MenuItem", MenuItemSchema);
