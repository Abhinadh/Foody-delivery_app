import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RestaurantDashboard from './pages/Dashboards/RestaurantDashboard';
import DeliveryBoyDashboard from './pages/Dashboards/DeliveryBoyDashboard';
import AdminDashboard from './pages/Dashboards/admin/AdminDashboard';
import { UserProvider } from './context/UserContext';
import { SearchProvider } from "./context/SearchContext";
import Navbar from './pages/Navbar';
import React, { useState } from "react";
import Modal from "../src/pages/Modal";
import DescriptionPage from './pages/Description';
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import OrderTracking from './pages/MyOrders';
import Dabbawala from './pages/Dabbawala'




function App() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("login");

  return (
    <UserProvider>
      <SearchProvider>
    <Router>
    <Navbar setShowModal={setShowModal} setModalType={setModalType} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard/user" element={<HomePage />} />
        <Route path="/dashboard/restaurant" element={<RestaurantDashboard />} />
        <Route path="/dashboard/deliveryboy" element={<DeliveryBoyDashboard />} />
        <Route path="/description/:id" element={<DescriptionPage/>}/>
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/cart" element={<Cart/>} />
        <Route path="/dabbawala" element={<Dabbawala/>} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/my-orders" element={<OrderTracking />} />
      </Routes>

            {/* Login/Signup Modal (Global for all pages) */}
            {showModal && <Modal modalType={modalType} setModalType={setModalType} setShowModal={setShowModal} />}
    </Router>
    </SearchProvider>
    </UserProvider>
  );
}

export default App;
