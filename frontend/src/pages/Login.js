import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/Login.css"
export default function Login() {
  const [credentials, setCredentials] = useState({});
  const navigate = useNavigate();
  
const BACKEND_URI =process.env.BACKEND_URI
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BACKEND_URI}/api/auth/login`, credentials);
      alert('Login successful');
      navigate(`/dashboard/${res.data.account.role}`); // Corrected response handling
    } catch (err) {
      console.error('Login error:', err.response ? err.response.data : err.message);
      alert('Invalid credentials');
    }
  };
  

  return (
    <div className="log">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
