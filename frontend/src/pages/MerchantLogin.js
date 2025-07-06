import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { useAuth } from '../context/AuthContext';

export default function MerchantLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const { access } = await login(username, password);
      setAuth(access); 
      alert("Login successful");
      navigate("/merchant/orders");
    } catch (err) {
      alert("Login failed");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Merchant Login</h2>
      <input placeholder="username" onChange={e => setUsername(e.target.value)} />
      <br />
      <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)} />
      <br />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
