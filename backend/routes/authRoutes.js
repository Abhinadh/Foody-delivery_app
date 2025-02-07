

const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const DeliveryBoy = require("../models/DeliveryBoy");
const Account = require("../models/Accounts");

const router = express.Router();


router.post('/register', async (req, res) => {
    const { name, email, password, role, address, assignedRegion } = req.body;

    // Check if account already exists
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
        return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create an Account entry first
    const account = new Account({
        email,
        password: hashedPassword,
        role
    });

    try {
        // Save the account first
        await account.save();

        // Now, create the user in the corresponding collection based on the role
        let user;

        if (role === 'user') {
            user = new User({ name, email, password: hashedPassword, address });
            await user.save();
        } else if (role === 'restaurant') {
            user = new Restaurant({ name, email, password: hashedPassword, address, approved: false });
            await user.save();
        } else if (role === 'deliveryboy') {
            user = new DeliveryBoy({ name, email, password: hashedPassword, assignedRegion });
            await user.save();
        }

        res.status(201).json({ message: `${role} registered successfully` });
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the account by email
        const account = await Account.findOne({ email });
        if (!account) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare the password with the hashed password in the Account table
        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // If credentials are correct, return the account data
        res.json({
            message: 'Login successful',
            account,
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
// fetch all restuarnt
router.get('/admin/restaurants', async (req, res) => {
// Fetch All Restaurants
router.get('/admin/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Fetch All Delivery Boys
router.get('/admin/deliveryboys', async (req, res) => {
    try {
        const deliveryBoys = await DeliveryBoy.find();
        res.json(deliveryBoys);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete Restaurant by ID
router.delete('/admin/delete/restaurant/:id', async (req, res) => {
    try {
        const restaurantId = req.params.id;
        
        // Find and delete restaurant
        const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        res.json({ message: 'Restaurant deleted successfully' });
    } catch (err) {
        console.error("Delete Restaurant Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete Delivery Boy by ID
router.delete('/admin/delete/deliveryboy/:id', async (req, res) => {
    try {
        const deliveryBoyId = req.params.id;

        // Find and delete delivery boy
        const deliveryBoy = await DeliveryBoy.findByIdAndDelete(deliveryBoyId);

        if (!deliveryBoy) {
            return res.status(404).json({ message: 'Delivery boy not found' });
        }

        res.json({ message: 'Delivery boy deleted successfully' });
    } catch (err) {
        console.error("Delete Delivery Boy Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
});




module.exports = router;