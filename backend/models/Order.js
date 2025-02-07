const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy', default: null },
    items: [{ name: String, price: Number, quantity: Number }],
    totalAmount: Number,
    status: { type: String, enum: ['Pending', 'Accepted', 'Assigned', 'Delivered'], default: 'Pending' },
    deliveryLocation: {
        lat: Number,
        lng: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
