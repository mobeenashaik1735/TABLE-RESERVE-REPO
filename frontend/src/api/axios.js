import axios from 'axios';

const API = axios.create({
  baseURL:'https://table-reserve-repo.onrender.com/api',
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      err.message = 'Cannot reach server. Please check your connection or try again later.';
    }
    return Promise.reject(err);
  }
);

export default API;
