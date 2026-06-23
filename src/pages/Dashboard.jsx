import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await api.get("/tickets/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    navigate("/");
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: "8px 15px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        <StatCard title="Total Tickets" value={stats?.total} color="#007bff" />
        <StatCard title="Open" value={stats?.open} color="#ffc107" />
        <StatCard title="In Progress" value={stats?.inProgress} color="#17a2b8" />
        <StatCard title="Resolved" value={stats?.resolved} color="#28a745" />
      </div>

      <div style={{ marginTop: "30px" }}>
        <a href="/tickets" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", textDecoration: "none", borderRadius: "4px" }}>
          View All Tickets →
        </a>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={{ backgroundColor: color, color: "white", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
      <h3>{title}</h3>
      <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0" }}>{value}</p>
    </div>
  );
}
