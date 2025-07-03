import axios from 'axios'

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const placeOrder = (studentName, items) => {
    return axios.post(`${BASE_URL}/api/place-order`, {
        student_name: studentName,
        items: items
    });
};

export const getOrders = () => {
    return axios.get(`${BASE_URL}/api/orders`);
};