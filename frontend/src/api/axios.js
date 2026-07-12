import axios from 'axios';

// Automatically choose local vs live server addresses
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API = axios.create({
  baseURL: isLocalhost 
    ? 'http://localhost:3000/api'                    // When running on VS Code (Local)
    : 'https://table-reserve-repo.onrender.com/api', // When running on Vercel (Live Production)
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