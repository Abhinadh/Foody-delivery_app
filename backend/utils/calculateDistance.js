const axios = require("axios");

const calculateDistance = async (origin, destination) => {
    try {
        const apiKey = "AIzaSyCPfWpbibiw83RQsxELttr0vL9Ic64Sf9s"; // Replace with your valid API Key
        const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
            params: {
                origins: origin,
                destinations: destination,
                key: apiKey
            }
        });

        console.log("Full API Response:", JSON.stringify(response.data, null, 2)); // Debugging

        if (response.data.status !== "OK") {
            console.error("API Error:", response.data.error_message || "Unknown error");
            return 30; // Default fallback
        }

        const element = response.data.rows[0].elements[0];

        if (element.status !== "OK") {
            console.error("Element Error:", element.status);
            return 30; // Default fallback
        }

        const timeInMinutes = element.duration.text; // Convert seconds to minutes

        return timeInMinutes;
    } catch (error) {
        console.error("Error calculating distance:", error.message);
        return 30; // Default fallback
    }
};

module.exports = calculateDistance;
