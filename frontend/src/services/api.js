import axios from "axios";

// Base URL will be replaced by an env variable (VITE_API_URL) in production
const api = axios.create({
  baseURL: "http://localhost:5000",
});

export default api;
