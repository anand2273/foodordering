import axios from 'axios';

export const fetchOrders = () => {
  return axios.get('http://localhost:8000/api/orders/');
};
