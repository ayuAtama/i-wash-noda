import axios from "axios";

const PUBLIC_PATHS = ["/login", "/register", "/logins"];

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        const configUrl = error.config?.url || "";

        const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
        const isMeCheck = configUrl.includes("/api/me");

        if (!isPublicPage && !isMeCheck) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
