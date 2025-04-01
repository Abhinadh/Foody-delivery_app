import { useEffect } from "react";
import { FaCheckCircle, FaHandshake } from "react-icons/fa";
import "../styles/SuccessModal.css";

const SuccessModal = ({ type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 2000); // Auto-close after 2 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="success-modal-overlay">
            <div className="success-modal-content">
                {type === "login" ? (
                    <>
                        <FaCheckCircle className="success-icon tick" />
                        <h2>Login Successful!</h2>
                    </>
                ) : (
                    <>
                        <FaHandshake className="success-icon handshake" />
                        <h2>Registration Successful!</h2>
                    </>
                )}
            </div>
        </div>
    );
};

export default SuccessModal;
