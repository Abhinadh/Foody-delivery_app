const mongoose = require("mongoose");

const DabbawalaSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    recei_phone: {
        type: Number,
        required: true
    },
    sender: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    receiverLocation: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    pickupAddress: {
        type: String,
        default: ""
    },
    deliveryAddress: {
        type: String,
        default: ""
    },
    item: {
        type: String,
        required: true
    },
    distance: {
        type: Number,
        default: 0
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryBoy"
    },
    status: {
        type: String,
        enum: ["Pending", "Picked", "In Transit", "Delivered", "Cancelled"],
        default: "Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Dabbawala", DabbawalaSchema);