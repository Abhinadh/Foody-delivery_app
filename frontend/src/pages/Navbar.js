import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSearch } from "../context/SearchContext";
import axios from "axios";
import "../styles/Navbar.css";
import { PiHamburgerBold } from "react-icons/pi";
import { RiLogoutCircleRLine, RiAccountCircleLine } from "react-icons/ri";
import { IoSettingsOutline, IoCheckmarkCircleOutline } from "react-icons/io5"; 
import { TbShoppingCartSearch } from "react-icons/tb";
import { MdOutlineShoppingBag } from "react-icons/md"; // Icon for My Orders

const Navbar = ({ setShowModal, setModalType }) => {
    const { user, logout } = useUser();
    const { setSearchQuery } = useSearch();
    const [showSidebar, setShowSidebar] = useState(false);
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const iconStyle = { color: "#FF4500", fontSize: "22px", minWidth: "30px" };

    useEffect(() => {
        if (user?.email) {
            axios.get(`http://localhost:5000/api/auth/user/profile?email=${user.email}`)
                .then(response => {
                    setUserName(response.data.name);
                    setUserRole(response.data.role); // Set user role from API response
                })
                .catch(error => {
                    console.error("Error fetching user profile:", error);
                });
        }
    }, [user]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchQuery(query);
        navigate("/");
    };

    const handleLogout = () => {
        setShowSidebar(false);
        setTimeout(() => {
            setShowLogoutModal(true);
            setTimeout(() => {
                logout();
                window.location.reload();
            }, 1500);
        }, 300);
    };

    return (
        <>
            <nav className="nav-ahja">
                <div className="nav-left-ahja">
                    <Link to="/" className="logo-ahja">Foodie</Link>
                    
                    <form onSubmit={handleSearch} className="search-form-ahja">
                        <input
                            type="text"
                            placeholder="Search for food/restaurants..."
                            className="search-ahja"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button type="submit" className="search-btn-ahja"><TbShoppingCartSearch /></button>
                    </form>
                </div>

                <div className="nav-right-ahja">
                    <Link to="/cart" className="cart-ahja">🛒 Cart</Link>
                    <Link to="/dabbawala" className="dabba-wala-btn-ahja">📦 Dabbawala</Link>
                    {user ? (
                        <button 
                            className="profile-ahja" 
                            onClick={() => setShowSidebar(!showSidebar)}
                        >
                            <PiHamburgerBold />
                        </button>
                    ) : (
                        <button 
                            className="signin-ahja"
                            onClick={() => {
                                setModalType("login");
                                setShowModal(true);
                            }}
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </nav>

            {showSidebar && (
                <>
                    <div className={`overlay-ahja ${showSidebar ? "active" : ""}`} onClick={() => setShowSidebar(false)}></div>
                    <div className={`sidebar-ahja ${showSidebar ? "active" : ""}`}>
                        <button className="close-sidebar" onClick={() => setShowSidebar(false)}>×</button>

                        <div className="welcome-message" style={{ padding: "15px", fontSize: "18px", fontWeight: "bold", borderBottom: "1px solid #ddd", textAlign: "center" }}>
                            Welcome, {userName || "User"}
                        </div>

                        <ul style={{ padding: "10px" }}>
                            <li style={{ display: "flex", alignItems: "center", padding: "10px 0" }}>
                                <RiAccountCircleLine style={iconStyle} />
                                <Link to="/profile" style={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}>Account</Link>
                            </li>
                            
                            {user.role === "user" && (
                                <li style={{ display: "flex", alignItems: "center", padding: "10px 0" }}>
                                    <MdOutlineShoppingBag style={iconStyle} />
                                    <Link to="/my-orders" style={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}>My Orders</Link>
                                </li>
                            )}

                            <li style={{ display: "flex", alignItems: "center", padding: "10px 0" }}>
                                <IoSettingsOutline style={iconStyle} />
                                <Link to="/settings" style={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}>Settings</Link>
                            </li>

                            <li style={{ display: "flex", alignItems: "center", padding: "10px 0" }}>
                                <RiLogoutCircleRLine style={iconStyle} />
                                <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", flexGrow: 1, textAlign: "left" }}>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </>
            )}

            {showLogoutModal && (
                <div className="logout-modal">
                    <IoCheckmarkCircleOutline className="logout-icon" />
                    <p>Logged Out Successfully</p>
                </div>
            )}
        </>
    );
};

export default Navbar;
