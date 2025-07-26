import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const getMenuItems =  (business_slug) => {
    return axios.get(`${BASE_URL}/${business_slug}/api/menu/`);
};

export const getMenuItemBySlug = (slug, business_slug) => {
    return axios.get(`${BASE_URL}/${business_slug}/api/menu-item/${slug}`);
};

