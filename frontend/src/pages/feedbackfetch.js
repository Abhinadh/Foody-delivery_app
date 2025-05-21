import { useEffect, useState } from "react";

const FeedbackPage = () => {
    const [feedback, setFeedback] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/api/auth/feedback/fetch") // Adjust URL as needed
            .then(response => response.json())
            .then(data => setFeedback(data))
            .catch(error => console.error("Error fetching feedback:", error));
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">User Feedback</h1>
            {feedback.length === 0 ? (
                <p>No feedback available.</p>
            ) : (
                <ul className="space-y-3">
                    {feedback.map((item, index) => (
                        <li key={index} className="p-3 border rounded-lg shadow-md">
                            <p><strong>Restaurant:</strong> {item.restaurantEmail}</p>
                            <p><strong>User:</strong> {item.userId || "Unknown"}</p>
                            <p><strong>Rating:</strong> {item.rating} ⭐</p>
                            <p><strong>Comment:</strong> {item.comment || "No comment"}</p>
                            
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FeedbackPage;
