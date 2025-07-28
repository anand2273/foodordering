import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL

export async function login(username, password) {
  try {
    const res = await axios.post(`${BASE_URL}/api/token/`, {
      username,
      password,
    });

    const { access, refresh } = res.data;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
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

