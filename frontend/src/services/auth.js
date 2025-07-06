import axios from 'axios';

const API_URL = 'http://localhost:8000/api/token/';

export async function login(username, password) {
  try {
    const res = await axios.post('http://localhost:8000/api/token/', {
      username,
      password,
    });

    const { access, refresh } = res.data;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    return { access, refresh };
  } catch (err) {
    console.error("Login failed:", err.response?.data || err.message);
    throw new Error("Invalid username or password");
  }
}


export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  delete axios.defaults.headers.common['Authorization'];
}

