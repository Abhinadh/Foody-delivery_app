import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaUtensils, FaMotorcycle, FaUserClock, FaSearch, FaSignOutAlt, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaTrash, FaBox } from 'react-icons/fa';

export default function AdminDashboard() {
    const [restaurants, setRestaurants] = useState([]);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [dabbawalas, setDabbawalas] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const { logout } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([fetchRestaurants(), fetchDeliveryBoys(), fetchDabbawalas()])
            .finally(() => setLoading(false));
    }, []);

    const fetchRestaurants = async () => {
        try {
            const res = await axios.get("${BACKEND_URI}/api/auth/admin/restaurants");
            setRestaurants(res.data);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
        }
    };

    const fetchDeliveryBoys = async () => {
        try {
            const res = await axios.get(`${BACKEND_URI}/api/auth/admin/deliveryboys`);
            setDeliveryBoys(res.data);
        } catch (error) {
            console.error("Error fetching delivery boys:", error);
        }
    };

    const fetchDabbawalas = async () => {
        try {
            const res = await axios.get(`${BACKEND_URI}/api/auth/dabbawala-orders`);
            setDabbawalas(res.data);
            console.log(res.data);
        } catch (error) {
            console.error("Error fetching dabbawala orders:", error);
        }
    };

    const handleDelete = async (id, role) => {
        try {
            const url = role === "restaurant"
                ? `${BACKEND_URI}/api/auth/admin/delete/restaurant/${id}`
                : `${BACKEND_URI}/api/auth/admin/delete/deliveryboy/${id}`;

            await axios.delete(url);
            
            showToast(`${role === "restaurant" ? "Restaurant" : "Delivery partner"} deleted successfully`);
            
            role === "restaurant" ? fetchRestaurants() : fetchDeliveryBoys();
        } catch (error) {
            console.error("Error deleting user:", error);
            showToast("Error deleting user", "error");
        }
    };

    const handleApprove = async (id, email) => {
        try {
            await axios.post(`${BACKEND_URI}/api/auth/admin/approve/restaurant/${id}`);
            
            await axios.post(`${BACKEND_URI}/api/auth/admin/send-approval-email`, { email });
            
            showToast("Restaurant approved successfully");
            fetchRestaurants();
        } catch (error) {
            console.error("Error approving restaurant:", error.message);
            showToast("Error approving restaurant", "error");
        }
    };

    const handleReject = async (id) => {
        try {
            await axios.post(`${BACKEND_URI}/api/auth/admin/reject/restaurant/${id}`);
            showToast("Restaurant rejected successfully");
            fetchRestaurants();
        } catch (error) {
            console.error("Error rejecting restaurant:", error.message);
            showToast("Error rejecting restaurant", "error");
        }
    };

    const showToast = (message, type = "success") => {
        const toastDiv = document.createElement("div");
        toastDiv.className = `toast-notification ${type}`;
        toastDiv.textContent = message;
        document.body.appendChild(toastDiv);
        
        setTimeout(() => {
            toastDiv.classList.add("show");
            setTimeout(() => {
                toastDiv.classList.remove("show");
                setTimeout(() => {
                    document.body.removeChild(toastDiv);
                }, 300);
            }, 3000);
        }, 100);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const extractCoordinates = (address) => {
        const regex = /([-+]?\d{1,3}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/;
        const match = address?.match(regex);
        return match ? { latitude: match[1], longitude: match[2] } : null;
    };

    const filteredRestaurants = restaurants.filter((restaurant) =>
        restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDeliveryBoys = deliveryBoys.filter((deliveryBoy) =>
        deliveryBoy.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const filteredDabbawalas = dabbawalas.filter((dabbawala) =>
        dabbawala.receiver?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dabbawala.item?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingRestaurants = filteredRestaurants.filter((restaurant) => !restaurant.approved);
    const approvedRestaurants = filteredRestaurants.filter((restaurant) => restaurant.approved);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <div className="container-fluid">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <h1 className="dashboard-title">
                                Foody AdminDashboard
                            </h1>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex justify-content-end">
                                <div className="search-container me-3">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search by name"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="search-input"
                                    />
                                </div>
                                <button className="btn btn-logout" onClick={handleLogout}>
                                    <FaSignOutAlt className="me-2" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-stats container-fluid mb-4">
                <div className="row">
                    <div className="col-md-3">
                        <div className="stat-card pending">
                            <div className="stat-icon">
                                <FaUserClock />
                            </div>
                            <div className="stat-info">
                                <h3>{pendingRestaurants.length}</h3>
                                <p>Pending Restaurants</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card approved">
                            <div className="stat-icon">
                                <FaUtensils />
                            </div>
                            <div className="stat-info">
                                <h3>{approvedRestaurants.length}</h3>
                                <p>Approved Restaurants</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card delivery">
                            <div className="stat-icon">
                                <FaMotorcycle />
                            </div>
                            <div className="stat-info">
                                <h3>{filteredDeliveryBoys.length}</h3>
                                <p>Delivery Partners</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card dabbawala">
                            <div className="stat-icon">
                                <FaBox />
                            </div>
                            <div className="stat-info">
                                <h3>{filteredDabbawalas.length}</h3>
                                <p>Dabbawala Orders</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-content container-fluid">
                <div className="row">
                    <div className="col-md-6">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="content-card pending-card">
                                    <div className="card-header">
                                        <h3><FaUserClock className="me-2" />Pending Approvals</h3>
                                    </div>
                                    <div className="card-body">
                                        {pendingRestaurants.length === 0 ? (
                                            <div className="empty-state">
                                                <p>No pending restaurant approvals</p>
                                            </div>
                                        ) : (
                                            pendingRestaurants.map((restaurant) => {
                                                const coords = restaurant.location?.lat && restaurant.location?.lng
                                                    ? { latitude: restaurant.location.lat, longitude: restaurant.location.lng }
                                                    : extractCoordinates(restaurant.address);

                                                return (
                                                    <div key={restaurant._id} className="restaurant-card">
                                                        <div className="restaurant-header">
                                                            <h4>{restaurant.name}</h4>
                                                            <span className="badge bg-warning">Pending</span>
                                                        </div>
                                                        <div className="restaurant-details">
                                                            <p><strong>Email:</strong> {restaurant.email}</p>
                                                            <p><strong>Address:</strong> {restaurant.address}</p>
                                                            {coords && (
                                                                <p>
                                                                    <FaMapMarkerAlt className="me-1" />
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="map-link"
                                                                    >
                                                                        View on Google Maps
                                                                    </a>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="restaurant-actions">
                                                            <button 
                                                                className="btn btn-sm btn-success" 
                                                                onClick={() => handleApprove(restaurant._id, restaurant.email)}
                                                            >
                                                                <FaCheckCircle className="me-1" /> Approve
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-danger" 
                                                                onClick={() => handleReject(restaurant._id)}
                                                            >
                                                                <FaTimesCircle className="me-1" /> Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="content-card approved-card">
                                    <div className="card-header">
                                        <h3><FaUtensils className="me-2" />Approved Restaurants</h3>
                                    </div>
                                    <div className="card-body">
                                        {approvedRestaurants.length === 0 ? (
                                            <div className="empty-state">
                                                <p>No approved restaurants</p>
                                            </div>
                                        ) : (
                                            approvedRestaurants.map((restaurant) => {
                                                const coords = restaurant.location?.lat && restaurant.location?.lng
                                                    ? { latitude: restaurant.location.lat, longitude: restaurant.location.lng }
                                                    : extractCoordinates(restaurant.address);

                                                return (
                                                    <div key={restaurant._id} className="restaurant-card">
                                                        <div className="restaurant-header">
                                                            <h4>{restaurant.name}</h4>
                                                            <span className="badge bg-success">Approved</span>
                                                        </div>
                                                        <div className="restaurant-details">
                                                            <p><strong>Email:</strong> {restaurant.email}</p>
                                                            <p><strong>Address:</strong> {restaurant.address}</p>
                                                            {coords && (
                                                                <p>
                                                                    <FaMapMarkerAlt className="me-1" />
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="map-link"
                                                                    >
                                                                        View on Google Maps
                                                                    </a>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="restaurant-actions">
                                                            <button 
                                                                className="btn btn-sm btn-danger" 
                                                                onClick={() => handleDelete(restaurant._id, "restaurant")}
                                                            >
                                                                <FaTrash className="me-1" /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="content-card delivery-card">
                                    <div className="card-header">
                                        <h3><FaMotorcycle className="me-2" />Delivery Partners</h3>
                                    </div>
                                    <div className="card-body">
                                        {filteredDeliveryBoys.length === 0 ? (
                                            <div className="empty-state">
                                                <p>No delivery partners found</p>
                                            </div>
                                        ) : (
                                            filteredDeliveryBoys.map((deliveryBoy) => (
                                                <div key={deliveryBoy._id} className="delivery-card">
                                                    <div className="delivery-header">
                                                        <h4>{deliveryBoy.name}</h4>
                                                        <div className="delivery-status">
                                                            <span className={`status-indicator ${deliveryBoy.isActive ? 'active' : 'Inactive'}`}></span>
                                                            <span>{deliveryBoy.isActive ? 'Active' : 'Active'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="delivery-details">
                                                        <p><strong>Email:</strong> {deliveryBoy.email}</p>
                                                        <p><strong>Region:</strong> {deliveryBoy.assignedRegion || 'Unassigned'}</p>
                                                    </div>
                                                    <div className="delivery-actions">
                                                        <button 
                                                            className="btn btn-sm btn-danger" 
                                                            onClick={() => handleDelete(deliveryBoy._id, "deliveryboy")}
                                                        >
                                                            <FaTrash className="me-1" /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="content-card dabbawala-card">
                                    <div className="card-header">
                                        <h3><FaBox className="me-2" />Dabbawala Orders</h3>
                                    </div>
                                    <div className="card-body">
                                        {filteredDabbawalas.length === 0 ? (
                                            <div className="empty-state">
                                                <p>No dabbawala orders found</p>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Receiver</th>
                                                            <th>Phone</th>
                                                            <th>Item</th>
                                                            <th>Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredDabbawalas.map((dabbawala) => (
                                                            <tr key={dabbawala._id}>
                                                                <td>{dabbawala.receiver}</td>
                                                                <td>{dabbawala.recei_phone}</td>
                                                                <td>{dabbawala.item}</td>
                                                                <td>{new Date(dabbawala.createdAt).toLocaleDateString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .admin-dashboard {
                    min-height: 100vh;
                    background-color: #f8f9fa;
                    font-family: 'Poppins', sans-serif;
                }

                .dashboard-header {
                    background-color: #ffffff;
                    padding: 20px 0;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
                    margin-bottom: 30px;
                }

                .dashboard-title {
                    display: flex;
                    align-items: center;
                    font-size: 24px;
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                }

                .search-container {
                    position: relative;
                    margin-right: 15px;
                }

                .search-input {
                    padding: 8px 15px 8px 40px;
                    border-radius: 50px;
                    border: 1px solid #e0e0e0;
                    width: 250px;
                    font-size: 14px;
                    transition: all 0.3s;
                }

                .search-input:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(255, 96, 87, 0.2);
                    border-color: #ff6057;
                }

                .search-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #999;
                }

                .btn-logout {
                    background-color: #ff6057;
                    color: white;
                    border: none;
                    border-radius: 50px;
                    padding: 8px 20px;
                    display: flex;
                    align-items: center;
                    transition: all 0.3s;
                }

                .btn-logout:hover {
                    background-color: #e55045;
                    box-shadow: 0 4px 10px rgba(229, 80, 69, 0.3);
                }

                .dashboard-stats {
                    margin-bottom: 30px;
                }

                .stat-card {
                    display: flex;
                    align-items: center;
                    background-color: #fff;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                    transition: all 0.3s;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }

                .stat-card.pending {
                    border-left: 5px solid #ffc107;
                }

                .stat-card.approved {
                    border-left: 5px solid #28a745;
                }

                .stat-card.delivery {
                    border-left: 5px solid #17a2b8;
                }
                
                .stat-card.dabbawala {
                    border-left: 5px solid #6f42c1;
                }

                .stat-icon {
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 24px;
                    margin-right: 20px;
                }

                .stat-card.pending .stat-icon {
                    background-color: rgba(255, 193, 7, 0.2);
                    color: #ffc107;
                }

                .stat-card.approved .stat-icon {
                    background-color: rgba(40, 167, 69, 0.2);
                    color: #28a745;
                }

                .stat-card.delivery .stat-icon {
                    background-color: rgba(23, 162, 184, 0.2);
                    color: #17a2b8;
                }
                
                .stat-card.dabbawala .stat-icon {
                    background-color: rgba(111, 66, 193, 0.2);
                    color: #6f42c1;
                }

                .stat-info h3 {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0;
                    color: #333;
                }

                .stat-info p {
                    font-size: 14px;
                    color: #777;
                    margin: 5px 0 0 0;
                }

                .content-card {
                    background-color: #fff;
                    border-radius: 12px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                    margin-bottom: 30px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .card-header {
                    padding: 20px;
                    border-bottom: 1px solid #f1f1f1;
                }

                .card-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    color: #333;
                }

                .pending-card .card-header {
                    background-color: rgba(255, 193, 7, 0.1);
                    color: #ffc107;
                }

                .approved-card .card-header {
                    background-color: rgba(40, 167, 69, 0.1);
                    color: #28a745;
                }

                .delivery-card .card-header {
                    background-color: rgba(23, 162, 184, 0.1);
                    color: #17a2b8;
                }
                
                .dabbawala-card .card-header {
                    background-color: rgba(111, 66, 193, 0.1);
                    color: #6f42c1;
                }

                .card-body {
                    padding: 20px;
                    overflow-y: auto;
                    flex-grow: 1;
                }

                .restaurant-card, .delivery-card {
                    background-color: #f9f9f9;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    transition: all 0.3s;
                }

                .restaurant-card:hover, .delivery-card:hover {
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    transform: translateY(-3px);
                }

                .restaurant-header, .delivery-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .restaurant-header h4, .delivery-header h4 {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                    color: #333;
                }

                .restaurant-details, .delivery-details {
                    margin-bottom: 15px;
                }

                .restaurant-details p, .delivery-details p {
                    margin: 5px 0;
                    font-size: 14px;
                    color: #555;
                }

                .restaurant-actions, .delivery-actions {
                    display: flex;
                    gap: 10px;
                }

                .map-link {
                    color: #17a2b8;
                    text-decoration: none;
                    font-size: 14px;
                }

                .map-link:hover {
                    text-decoration: underline;
                }

                .empty-state {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 150px;
                    color: #999;
                    font-style: italic;
                }

                .delivery-status {
                    display: flex;
                    align-items: center;
                    font-size: 14px;
                }

                .status-indicator {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-right: 5px;
                }

                .status-indicator.active {
                    background-color: #28a745;
                }

                .status-indicator.inactive {
                    background-color: #dc3545;
                }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }

                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 25px;
                    border-radius: 8px;
                    color: white;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    z-index: 9999;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.3s;
                }
                
                .table {
                    margin-bottom: 0;
                    font-size: 14px;
                }
                
                .table thead th {
                    background-color: rgba(111, 66, 193, 0.05);
                    border-bottom: 2px solid #6f42c1;
                    color: #6f42c1;
                    font-weight: 600;
                }
                
                .table tbody tr:hover {
                    background-color: rgba(111, 66, 193, 0.03);
                }

                .toast-notification.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .toast-notification.success {
                    background-color: #28a745;
                }

                .toast-notification.error {
                    background-color: #dc3545;
                }

                @media (max-width: 992px) {
                    .dashboard-stats .col-md-3 {
                        margin-bottom: 20px;
                    }
                    
                    .dashboard-content .col-md-6 {
                        margin-bottom: 20px;
                    }
                }

                @media (max-width: 768px) {
                    .dashboard-header .col-md-6 {
                        margin-bottom: 15px;
                    }
                    
                    .dashboard-header .col-md-6:last-child {
                        display: flex;
                        justify-content: space-between;
                    }
                    
                    .search-input {
                        width: 180px;
                    }
                }

                @media (max-width: 575px) {
                    .search-container {
                        width: 100%;
                        margin-bottom: 15px;
                    }
                    
                    .search-input {
                        width: 100%;
                    }
                    
                    .dashboard-header .col-md-6:last-child {
                        flex-direction: column;
                    }
                    
                    .btn-logout {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}