import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";

export default function Register() {
  const query = new URLSearchParams(useLocation().search);
  const type = query.get("type"); // user, restaurant, deliveryboy
  const navigate = useNavigate();
  const BACKEND_URI =process.env.BACKEND_URI

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: type || "",
    address: type === "user" || type === "restaurant" ? "" : undefined,
    assignedRegion: type === "deliveryboy" ? "" : undefined,
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (!type || !["user", "restaurant", "deliveryboy"].includes(type)) {
      alert("Invalid registration type");
      navigate("/"); // Redirect to homepage or login
    }
  }, [type, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Sending Data:", formData);

    try {
      await axios.post(`https://foody-backend-l2zy.onrender.com/api/auth/register`, formData);
      alert(`${type} registered successfully`);
      navigate("/login");
    } catch (err) {
      console.error("Axios Error:", err.response ? err.response.data : err.message);
      alert(err.response?.data?.error || "Error registering");
    }
  };

  // This function captures the user's location via the map interaction
  const CaptureLocation = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFormData((prevData) => ({
          ...prevData,
          latitude: lat,
          longitude: lng,
          address: `Lat: ${lat}, Lng: ${lng}`, // Can be updated to use a geocoding service for a more readable address
        }));
        map.flyTo([lat, lng], map.getZoom());
      },
    });

    return null;
  };

  return (
    <div>
      <h2>Register as {type}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {type === "user" && (
          <>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
            />
            <MapContainer
              center={[51.505, -0.09]} // Default center position, adjust as needed
              zoom={13}
              style={{ width: "100%", height: "300px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CaptureLocation />
            </MapContainer>
          </>
        )}

        {type === "restaurant" && (
          <>
            <input
              type="text"
              name="address"
              placeholder="Restaurant Address"
              value={formData.address}
              onChange={handleChange}
              required
            />
            <MapContainer
              center={[51.505, -0.09]} // Default center position
              zoom={13}
              style={{ width: "100%", height: "300px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CaptureLocation />
            </MapContainer>
          </>
        )}

        {type === "deliveryboy" && (
          <input
            type="text"
            name="assignedRegion"
            placeholder="Assigned Region"
            value={formData.assignedRegion}
            onChange={handleChange}
            required
          />
        )}

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

