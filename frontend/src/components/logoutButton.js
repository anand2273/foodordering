import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
