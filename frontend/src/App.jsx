import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateComplaint from "./pages/CreateComplaint";
import { getComplaints } from "./api";

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    if (!user) return;

    const loadComplaints = async () => {
      try {
        const data = await getComplaints();
        const complaintList = Array.isArray(data) ? data : [];
        console.log("[App] Complaints loaded:", complaintList);
        setComplaints(complaintList);
      } catch (error) {
        console.error("[App] Failed to load complaints:", error);
        alert("Could not fetch complaints from backend.");
      }
    };

    loadComplaints();
  }, [user]);

  const navigate = (p) => setPage(p);

  const handleNewComplaint = (complaint) => {
    setComplaints(prev => [complaint, ...prev]);
    navigate("dashboard");
  };

  if (page === "login") return <Login onLogin={(u) => { setUser(u); if (u?.role) localStorage.setItem("role", u.role); if (u?.email) localStorage.setItem("userEmail", u.email); if (u?.name) localStorage.setItem("userName", u.name); navigate("dashboard"); }} onRegister={() => navigate("register")} />;
  if (page === "register") return <Register onBack={() => navigate("login")} onSuccess={() => navigate("login")} />;
  if (page === "dashboard") return <Dashboard user={user} complaints={complaints} onCreateComplaint={() => navigate("create")} onLogout={() => { setUser(null); setComplaints([]); localStorage.removeItem("role"); localStorage.removeItem("userEmail"); localStorage.removeItem("userName"); navigate("login"); }} />;
  if (page === "create") return <CreateComplaint user={user} onBack={() => navigate("dashboard")} onSuccess={handleNewComplaint} />;
}
