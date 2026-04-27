import axios from "axios";

/*
  IMPORTANT:
  VITE_API_URL = https://civic-issue-mini-project-cvuh.onrender.com
  (NO /api here)
*/
const BASE_URL = import.meta.env.VITE_API_URL;

// axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===========================
   COMPLAINT APIs
=========================== */

// CREATE
export const createComplaint = async (data) => {
  const res = await api.post("/complaints", data);
  return res.data;
};

// GET (with email)
export const getComplaints = async (userEmail) => {
  const res = await api.get("/complaints", {
    params: { userEmail },
  });
  return res.data;
};

// UPDATE STATUS
export const updateStatus = async (id, status) => {
  const res = await api.put(`/complaints/${id}/status`, null, {
    params: { status },
  });
  return res.data;
};

// SEND MAIL
export const sendComplaintMail = async (id, body) => {
  const res = await api.post(`/complaints/${id}/send-mail`, {
    body,
  });
  return res.data;
};

/* ===========================
   AI CHAT
=========================== */

export const chatWithAi = async (message) => {
  const res = await axios.post(`${BASE_URL}/chat`, null, {
    params: { message },
  });
  return res.data;
};