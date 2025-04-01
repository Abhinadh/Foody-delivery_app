
const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Restaurant = require("../models/Restaurant");
const DeliveryBoy = require("../models/DeliveryBoy");
const Account = require("../models/Accounts");
const Menu = require("../models/MenuItem")
const multer = require("multer");
const path = require("path")
const axios = require('axios');
const Order = require("../models/Order");
const Dabbawala = require("../models/Dabbawala");
const RestaurantBooking = require('../models/RestaurantBooking');
const calculateDistance = require('../utils/calculateDistance');
const router = express.Router();



const nodemailer = require("nodemailer");

router.post("/admin/send-approval-email", async (req, res) => {
    const { email } = req.body;
    console.log(email)

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "foodybuddy111@gmail.com",
            pass: "rzkhryrysnundyso",
        },
    });

    const mailOptions = {
        from: "foodybuddy111@gmail.com",
        to: email,
        subject: "Your Restaurant Has Been Approved!",
        text: "Congratulations! Your restaurant has been approved. You can now log in and start accepting orders.",
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: "Approval email sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error); // Log error details
        res.status(500).json({ message: "Error sending email" });
    }
});



router.post("/admin/approve/restaurant/:id", async (req, res) => {
    try {
        console.log("Restaurant ID:", req.params.id);
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, {approved: true }, { new: true });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: "Error approving restaurant" });
    }
});


// REGISTER NEW USER
router.post('/register', async (req, res) => {
    const { name, email, password, role, latitude, longitude,address, assignedRegion } = req.body;

    try {
        // Check if account already exists
        const existingAccount = await Account.findOne({ email });
        if (existingAccount) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Account entry
        const account = new Account({
            email,
            password: hashedPassword,
            role
        });

        await account.save();

        let user;
        if (role === 'user') {
            user = new User({ name, email, password: hashedPassword });
        } else if (role === 'restaurant') {
            user = new Restaurant({ 
                name, 
                email, 
                password: hashedPassword, 
                address,
                location: { lat: latitude, lng: longitude }, 
                approved: false 
            });
        } else if (role === 'deliveryboy') {
            user = new DeliveryBoy({ name, email, password: hashedPassword, assignedRegions:assignedRegion });
        }

        await user.save();
        res.status(201).json({ message: `${role} registered successfully` });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// LOGIN USER
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const account = await Account.findOne({ email });
        if (!account) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the account is a restaurant and if it's approved
        if (account.role === 'restaurant') {  // Assuming 'role' is the field differentiating types of accounts
            const restaurant = await Restaurant.findOne({ email });
            if (!restaurant) {
                return res.status(401).json({ message: 'Restaurant not found' });
            }
            if (!restaurant.approved) {
                return res.status(403).json({ message: 'Approval pending. Please wait for admin approval.' });
            }
        }

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            account,
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// FETCH ALL RESTAURANTS
router.get('/admin/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// FETCH ALL DELIVERY BOYS
router.get('/admin/deliveryboys', async (req, res) => {
    try {
        const deliveryBoys = await DeliveryBoy.find();
        res.json(deliveryBoys);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE RESTAURANT BY ID
router.delete('/admin/delete/restaurant/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (err) {
        console.error("Delete Restaurant Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE DELIVERY BOY BY ID
router.delete('/admin/delete/deliveryboy/:id', async (req, res) => {
    try {
        const deliveryBoy = await DeliveryBoy.findByIdAndDelete(req.params.id);
        if (!deliveryBoy) {
            return res.status(404).json({ message: 'Delivery boy not found' });
        }
        res.json({ message: 'Delivery boy deleted successfully' });
    } catch (err) {
        console.error("Delete Delivery Boy Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});




const sendRejectionEmail = async (email, restaurantName) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "foodybuddy111@gmail.com",
            pass: "rzkhryrysnundyso",
        },
    });

    const mailOptions = {
        from: "foodybuddy111@gmail.com",
        to: email,
        subject: "Your Restaurant Application Has Been Rejected",
        text: `Dear ${restaurantName},\n\nWe regret to inform you that your restaurant application has been rejected. We appreciate your interest and encourage you to apply again in the future.`,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Error sending rejection email");
    }
};

// Reject restaurant by ID (delete the restaurant)
router.post("/admin/reject/restaurant/:id", async (req, res) => {
    try {
        console.log("Restaurant ID:", req.params.id);

        // Find and delete the restaurant
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Send rejection email
        await sendRejectionEmail(restaurant.email, restaurant.name);

        // Delete the restaurant
        await Restaurant.findByIdAndDelete(req.params.id);

        res.json({ message: "Restaurant rejected and deleted successfully" });
    } catch (error) {
        console.error("Error rejecting restaurant:", error);
        res.status(500).json({ message: "Error rejecting restaurant" });
    }
});
// Set up multer storage for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    },
});

const upload = multer();


// Get menu items for a specific restaurant
router.get("/restaurant/:restaurantId/menu", async (req, res) => {
    const { restaurantId } = req.params;

    try {
        if (!restaurantId) {
            return res.status(400).json({ error: "Restaurant ID is required" });
        }

        const menuItems = await Menu.find({ restaurantId });

        if (!menuItems.length) {
            return res.status(404).json({ error: "No menu items found for this restaurant" });
        }

        res.json(menuItems);
    } catch (error) {
        console.error("Error fetching menu items:", error);
        res.status(500).json({ error: "Error fetching menu items" });
    }
});





router.post("/restaurant/menu/add", upload.single("image"), async (req, res) => {
    try {
        const { name, price, description, availability, restaurantId } = req.body;
        console.log(restaurantId)
        console.log(availability)

        // Convert stock count to a number
        const stockCount = parseInt(availability, 10);
        console.log(stockCount)
        

        // Set availability based on stock count (true if stockCount > 0, false otherwise)
        const isAvailable = stockCount > 0;

        // Ensure restaurantId is valid
         if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
             return res.status(400).json({ error: "Invalid or missing restaurantId" });
         }

        // Create a new menu item
        const newItem = new Menu({
            name,
            price,
            description,
            availability: isAvailable, // Corrected availability logic
            stockCount, // Store the actual stock count
            restaurantId, // Ensure restaurantId is properly passed
            image: req.file ? req.file.buffer : undefined,
        });

        // Save the menu item
        await newItem.save();

        res.status(201).json({ message: "Menu item added successfully!", menuItem: newItem });
    } catch (error) {
      
        res.status(500).json({ error: "Error adding menu item" });
    }
});



// Delete a menu item
router.delete("/restaurant/menu/delete/:id", async (req, res) => {
    try {
        const menuItem = await Menu.findByIdAndDelete(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ error: "Menu item not found" });
        }
        res.json({ message: "Menu item deleted successfully!" });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        res.status(500).json({ error: "Error deleting menu item" });
    }
});

//fetching meanu image
router.get("/restaurant/menu/image/:id", async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        
        if (!menuItem || !menuItem.image) {
            return res.status(404).send("Image not found");
        }

        res.set("Content-Type", "image/png");
        res.send(menuItem.image);
    } catch (error) {
        res.status(500).send("Error fetching image");
    }
});
// Get user profile details
router.get('/user/profile', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.query.email }); // Fetch by email
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

  



  
  router.get("/restaurants/fetchall", async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});  
// Fetch all menu items with restaurant name
router.get("/menu-items", async (req, res) => {
    try {
        const { category } = req.query; // Get category from query params
        let menuItems;
        
        if (category) {
            menuItems = await Menu.find({ name: { $regex: new RegExp(category, "i") } });
            // Fetch by category
        } else {
            menuItems = await Menu.find();
             // Fetch all if no category
        }

        res.status(200).json(menuItems);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});



router.get("/menu-items/:id", async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id);
        
        if (!menuItem) return res.status(404).json({ message: "Item not found" });
        res.json(menuItem);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/cart/add", async (req, res) => {
    try {
        const { userId, itemId, quantity } = req.body;
        if (!userId || !itemId) {
            return res.status(400).json({ error: "User ID and Item ID are required." });
        }

        // Check if item already exists in cart
        let cartItem = await Cart.findOne({ userId, itemId });

        if (cartItem) {
            cartItem.quantity += quantity || 1;
        } else {
            cartItem = new Cart({ userId, itemId, quantity });
        }

        await cartItem.save();
        res.status(201).json({ message: "Item added to cart successfully!" });

    } catch (err) {
        res.status(500).json({ error: "Server error: " + err.message });
    }
});

router.get("/cart/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        // Fetch cart items for the user
        const cartItems = await Cart.find({ userId });

        // Fetch item details from MenuItems table
        const enrichedCartItems = await Promise.all(
            cartItems.map(async (cartItem) => {
                const menuItem = await Menu.findOne({ _id: cartItem.itemId });
                return {
                    _id: cartItem._id,  // ✅ Include the cart document ID
                    userId: cartItem.userId,
                    quantity: cartItem.quantity,
                    item: menuItem,
                };
            })
        );

        res.status(200).json(enrichedCartItems);

    } catch (err) {
        res.status(500).json({ error: "Server error: " + err.message });
    }
});


router.delete("/cart/remove/:cartId", async (req, res) => {
    try {
        const { cartId } = req.params;
        if (!cartId) {
            return res.status(400).json({ error: "Cart ID is required." });
        }

        await Cart.findByIdAndDelete(cartId);
        res.status(200).json({ message: "Item removed from cart successfully!" });

    } catch (err) {
        res.status(500).json({ error: "Server error: " + err.message });
    }
});

router.put("/cart/update/:cartId", async (req, res) => {
    try {
        const { cartId } = req.params;
        const { quantity } = req.body;

        if (!cartId || !quantity) {
            return res.status(400).json({ error: "Cart ID and quantity are required." });
        }

        await Cart.findByIdAndUpdate(cartId, { quantity });
        res.status(200).json({ message: "Quantity updated successfully!" });

    } catch (err) {
        res.status(500).json({ error: "Server error: " + err.message });
    }
});


router.get('/admin/restaurants/name/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;

        // Find account with the given restaurantId
        const account = await Account.findOne({ _id:restaurantId });
        if (!account) {
            return res.status(404).json({ message: "Account not found for this restaurantId" });
        }

        // Find restaurant using the email from the account
        const restaurant = await Restaurant.findOne({ email: account.email });
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found for this account" });
        }

        res.json({email:restaurant.email, name: restaurant.name });
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
router.post("/place", async (req, res) => {
    console.log("✅ Route /place was hit");

    try {
        const { userId, itemId, quantity, totalPrice, restaurantName, restaurantEmail, location, buyerName } = req.body;

        if (!userId || !itemId || !quantity || !totalPrice || !restaurantName || !restaurantEmail || !location || !buyerName) {
            console.log("❌ Missing required fields");
            return res.status(400).json({ message: "All fields are required" });
        }

        console.log("✅ Received Order Data:", req.body);

        // Fetch restaurant location using restaurantName
        const restaurant = await Restaurant.findOne({ name: restaurantName });

        if (!restaurant) {
            console.log("❌ Restaurant not found in the database");
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const restaurantLocation = restaurant.address;
        console.log(`🏬 Restaurant Location for ${restaurantName}: ${restaurantLocation}`);

        // Save order
      




        // Extract location parts
        const locationParts = location.split(",").map(part => part.trim()).slice(1); // Remove house number
        console.log("📌 Extracted location parts:", locationParts);

        let assignedDeliveryBoy = null;

        // Try to find delivery boy based on priority order (first match is chosen)
        for (const area of locationParts) {
            assignedDeliveryBoy = await DeliveryBoy.findOne({
                assignedRegions: { $regex: new RegExp(area, "i") }
            }).sort({ assignmentsCount: 1 }).exec();

            if (assignedDeliveryBoy) {
                console.log("🚴‍♂️ Assigned Delivery Boy:", assignedDeliveryBoy.name, "in", area);
                break; // Stop if we found a match
            }
        }

        if (!assignedDeliveryBoy) {
            console.log("❌ No delivery boys available in this area");
            return res.status(400).json({ message: "No delivery boys available in your area" });
        }

        console.log(restaurantLocation);
        console.log(location);
        const estimatedTime = await calculateDistance(restaurantLocation, location);
        console.log(`⏳ Estimated Delivery Time: ${estimatedTime} mins`);

        const newOrder = new Order({
            userId,
            itemId,
            quantity,
            totalPrice,
            restaurantName,
            restaurantEmail,
            location,
            buyerName,
            bookingDate: new Date(),
            status: "On Order",
            createdAt: new Date(),
            estimatedDeliveryTime: estimatedTime // Save estimated time
        });
        
        
        console.log("📌 Saving order...");
        await newOrder.save();
        console.log("✅ Order saved:", newOrder);

        const newBooking = new RestaurantBooking({
            restaurantName,
            restaurantEmail,
            itemId,
            location,
            bookingDate: new Date(),
            status: "Pending",
            estimatedDeliveryTime: estimatedTime // Save estimated time
        });

        
        console.log("📌 Saving restaurant booking...");
        await newBooking.save();
        console.log("✅ Restaurant booking saved:", newBooking);


        // Update delivery boy assignments
        assignedDeliveryBoy.assignmentsCount = (assignedDeliveryBoy.assignmentsCount || 0) + 1;
        assignedDeliveryBoy.currentOrders = assignedDeliveryBoy.currentOrders || [];
        assignedDeliveryBoy.currentOrders.push(newOrder._id);

        console.log("📌 Updating delivery boy data...");
        await assignedDeliveryBoy.save();
        console.log("✅ Delivery boy updated:", assignedDeliveryBoy._id);

        res.status(201).json({
            message: "Order placed successfully",
            order: newOrder,
            restaurantBooking: newBooking,
            deliveryBoy: assignedDeliveryBoy,
            estimatedDeliveryTime: `${estimatedTime} mins`
        });

    } catch (error) {
        console.error("❌ Error placing order:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});


router.get("/orders/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(userId);
        console.log("hello........................");

        // Get restaurant email from accounts table
        const account = await Account.findOne({ _id: userId });
        console.log(account);
        if (!account) {
            return res.status(404).json({ error: "Restaurant account not found" });
        }

        // Fetch all orders for the restaurant, including "Delivered" ones
        const orders = await Order.find({ restaurantEmail: account.email }).sort({ createdAt: -1 });
        console.log(orders);

        // Attach menu item details and set adjusted timeRemaining
        const ordersWithMenuDetails = await Promise.all(
            orders.map(async (order) => {
                const menuItem = await Menu.findById(order.itemId);

                // Set time remaining based on estimated delivery time
                let timeRemaining = order.estimatedDeliveryTime > 30 ? 10 * 60 : 5 * 60; // Convert minutes to seconds

                return {
                    ...order.toObject(),
                    timeRemaining,
                    product: menuItem
                        ? {
                              name: menuItem.name,
                              image: menuItem.image
                          }
                        : null
                };
            })
        );

        res.json(ordersWithMenuDetails);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update order status
router.put("/orders/update-status/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!["Prepared", "Packed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });



        

        res.json(updatedOrder);
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/delivery-boy/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const deliveryBoy = await DeliveryBoy.findOne({ email }).populate("currentOrders");

        if (!deliveryBoy) {
            return res.status(404).json({ message: "Delivery Boy not found" });
        }

        // Fetch item details and restaurant address for each order
        const ordersWithDetails = await Promise.all(
            deliveryBoy.currentOrders.map(async (order) => {
                const menuItem = await Menu.findById(order.itemId);
                const restaurant = await Restaurant.findOne({ email: order.restaurantEmail });
                

                return {
                    ...order.toObject(),
                    itemName: menuItem ? menuItem.name : "Unknown Item",
                    restaurantAddress: restaurant ? restaurant.address : "Unknown Address",
                    deliveryAddress: order.deliveryAddress || "Unknown Address"
                };
            })
        );

        res.json({
            ...deliveryBoy.toObject(),
            currentOrders: ordersWithDetails,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update Availability Status
router.put("/delivery-boy/availability/:email", async (req, res) => {
    try {
        const { available } = req.body;
        const updatedDeliveryBoy = await DeliveryBoy.findOneAndUpdate(
            { email: req.params.email },
            { available },
            { new: true }
        );
        res.json({ deliveryBoy: updatedDeliveryBoy });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update Order Status
router.put("/order/status/:orderId", async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


router.get("/my-orders/:id", async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});
router.post("/dabbawala/create", async (req, res) => {
    try {
        console.log("Received Request Body:", req.body); // ✅ Log incoming data
        
        const { userId, receiver, recei_phone, sender, receiverLocation, item, distance, deliveryCharge } = req.body;
    
        if (!userId || !receiver || !recei_phone || !sender || !receiverLocation || !item) {
            console.log("Validation Failed! Missing fields.");
            return res.status(400).json({ error: "All fields are required" });
        }

        // Get address components from sender coordinates
        try {
            // Use Google Maps Geocoding API to get address from coordinates
            const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${sender.lat},${sender.lng}&key=AIzaSyDfnv9HFPrIMlVBMoFSl6LSBQj5G3rbOJo`;
            
            const geocodingResponse = await axios.get(geocodingUrl);
            
            if (geocodingResponse.data.status !== 'OK') {
                console.log("❌ Geocoding failed:", geocodingResponse.data.status);
                return res.status(400).json({ message: "Could not determine pickup location address" });
            }
            
            // Extract address components from geocoding response
            const addressComponents = geocodingResponse.data.results[0].address_components;
            
            // Extract relevant parts (neighborhood, sublocality, locality, administrative areas)
            const locationParts = addressComponents
                .filter(component => 
                    component.types.some(type => 
                        ['neighborhood', 'sublocality', 'sublocality_level_1', 
                         'locality', 'administrative_area_level_2', 
                         'administrative_area_level_1'].includes(type)
                    )
                )
                .map(component => component.long_name);
            
            console.log("📌 Extracted location parts:", locationParts);

            let assignedDeliveryBoy = null;

            // Try to find delivery boy based on priority order (first match is chosen)
            for (const area of locationParts) {
                assignedDeliveryBoy = await DeliveryBoy.findOne({
                    assignedRegions: { $regex: new RegExp(area, "i") }
                }).sort({ assignmentsCount: 1 }).exec();

                if (assignedDeliveryBoy) {
                    console.log("🚴‍♂️ Assigned Delivery Boy:", assignedDeliveryBoy.name, "in", area);
                    
                    // Update assignments count for the delivery boy
                    await DeliveryBoy.findByIdAndUpdate(
                        assignedDeliveryBoy._id,
                        { $inc: { assignmentsCount: 1 } }
                    );
                    
                    break; // Stop if we found a match
                }
            }

            if (!assignedDeliveryBoy) {
                // If no match by area, find the nearest available delivery boy
                console.log("⚠️ No delivery boys available in specific areas. Finding nearest available...");
                
                // Get all delivery boys
                const allDeliveryBoys = await DeliveryBoy.find({}).sort({ assignmentsCount: 1 }).exec();
                
                if (allDeliveryBoys.length === 0) {
                    console.log("❌ No delivery boys available at all");
                    return res.status(400).json({ message: "No delivery boys available in your area" });
                }
                
                // Assign the delivery boy with least assignments
                assignedDeliveryBoy = allDeliveryBoys[0];
                console.log("🚴‍♂️ Assigned nearest available delivery boy:", assignedDeliveryBoy.name);
                
                // Update assignments count
                await DeliveryBoy.findByIdAndUpdate(
                    assignedDeliveryBoy._id,
                    { $inc: { assignmentsCount: 1 } }
                );
            }

            // Create order with delivery boy assignment and delivery charge
            const order = new Dabbawala({ 
                userId, 
                receiver, 
                recei_phone, 
                sender, 
                receiverLocation, 
                item,
                distance: distance || 0,
                deliveryCharge: deliveryCharge || 0,
                deliveryBoyId: assignedDeliveryBoy._id,
                // Store the pickup address for reference
                pickupAddress: geocodingResponse.data.results[0].formatted_address
            });

            await order.save();
            res.status(201).json({ 
                message: "Order saved successfully!", 
                order,
                deliveryBoy: {
                    name: assignedDeliveryBoy.name,
                    phone: assignedDeliveryBoy.phone
                }
            });
            
        } catch (geocodingError) {
            console.error("Geocoding error:", geocodingError);
            return res.status(400).json({ message: "Unable to process pickup location" });
        }
        
    } catch (error) {
        console.error("Error saving order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;



