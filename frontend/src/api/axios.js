import axios from 'axios';

const API = axios.create({
  // Replace this with your exact Render backend URL
  baseURL: 'https://table-reserve-repo.onrender.com/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach token if it exists in local storage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;