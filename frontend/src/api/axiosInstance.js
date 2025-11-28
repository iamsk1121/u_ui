import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 60000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
