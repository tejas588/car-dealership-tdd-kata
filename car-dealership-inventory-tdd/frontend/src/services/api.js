import axios from "axios";

export const api = axios.create({ baseURL: "/api", timeout: 12000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("torque_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(error) {
  return (
    error.response?.data?.error?.message ||
    (error.code === "ECONNABORTED"
      ? "Request timed out. Please try again."
      : "Something went wrong. Please try again.")
  );
}
