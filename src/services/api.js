import axios from "axios";

const api = axios.create({
  baseURL: "https://admin-desk-backend.onrender.com/api",
});

export default api;
