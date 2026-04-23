import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createComplaint = (data) => {
  console.log("[API] POST /complaints request:", data);
  return api.post("/complaints", data).then((response) => {
    console.log("[API] POST /complaints response:", response.data);
    return response.data;
  });
};

export const chatWithAi = (message) => {
  console.log("[API] POST /chat request:", message);
  return axios.post(`${BACKEND_BASE_URL}/chat`, null, {
    params: { message },
  }).then((response) => {
    console.log("[API] POST /chat response:", response.data);
    return response.data;
  });
};

export const sendComplaintMail = (id, body) => {
  console.log(`[API] POST /complaints/${id}/send-mail request`);
  return api.post(`/complaints/${id}/send-mail`, { body }).then((response) => {
    console.log(`[API] POST /complaints/${id}/send-mail response:`, response.data);
    return response.data;
  });
};

export const getComplaints = (userEmail) => {
  console.log("[API] GET /complaints request:", userEmail);
  return api.get("/complaints", {
    params: { userEmail },
  }).then((response) => {
    console.log("[API] GET /complaints response:", response.data);
    return response.data;
  });
};

export const updateStatus = (id, status) => {
  console.log(`[API] PUT /complaints/${id}/status request:`, status);
  return api.put(`/complaints/${id}/status`, null, {
    params: { status },
  }).then((response) => {
    console.log(`[API] PUT /complaints/${id}/status response:`, response.data);
    return response.data;
  });
};
