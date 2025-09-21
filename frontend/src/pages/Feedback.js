import React, { useState } from "react";
import axios from "axios";

const FeedbackForm = ({ itemId,orderId, restaurantEmail, userId, onClose }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    const submitFeedback = async () => {
        try {
            console.log(restaurantEmail);
            await axios.post(`${BACKEND_URI}/api/auth/feedback/add`, {
                itemId,
                restaurantEmail,
                userId,
                rating,
                comment,
                orderId,
            });
            setFeedbackSubmitted(true);
            setTimeout(onClose, 2000); // Close modal after 2 seconds
        } catch (error) {
            console.error("Failed to submit feedback:", error);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-md w-96">
            <h4 className="text-lg font-bold">Give Feedback</h4>
            {feedbackSubmitted ? (
                <p className="text-green-600">Thank you for your feedback!</p>
            ) : (
                <>
                    <label className="block mt-2">Rating:</label>
                    <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border p-2 w-full">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                    
                    <label className="block mt-2">Comment:</label>
                    <textarea 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)} 
                        className="border p-2 w-full"
                        placeholder="Share your experience..."
                    />

                    <div className="flex justify-end space-x-2 mt-3">
                        <button onClick={onClose} className="bg-gray-400 text-white p-2 rounded">Cancel</button>
                        <button onClick={submitFeedback} className="bg-blue-500 text-white p-2 rounded">Submit</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default FeedbackForm;
