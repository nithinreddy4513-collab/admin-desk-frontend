import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        // Get user role from localStorage
        const role = localStorage.getItem("role");
        setUserRole(role);

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
        <StatCard title="Total Tickets" value={stats?.totalTickets} color="#007bff" />
        <StatCard title="Assigned" value={stats?.assignedTickets} color="#28a745" />
        <StatCard title="Unassigned" value={stats?.unassignedTickets} color="#ffc107" />
        <StatCard title="Open" value={stats?.openTickets} color="#dc3545" />
        <StatCard title="In Progress" value={stats?.inProgressTickets} color="#17a2b8" />
        <StatCard title="Resolved" value={stats?.resolvedTickets} color="#28a745" />
        <StatCard title="Total Users" value={stats?.totalUsers} color="#6c757d" />
        <StatCard title="Active Users" value={stats?.activeUsers} color="#28a745" />
      </div>

      <div style={{ marginTop: "30px" }}>
        <Link to="/my-tickets" style={{ padding: "10px 20px", backgroundColor: "#17a2b8", color: "white", textDecoration: "none", borderRadius: "4px", marginRight: "10px" }}>
          📋 My Tickets
        </Link>
        <Link to="/tickets" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", textDecoration: "none", borderRadius: "4px", marginRight: "10px" }}>
          View All Tickets →
        </Link>
        <Link to="/reports" style={{ padding: "10px 20px", backgroundColor: "#6f42c1", color: "white", textDecoration: "none", borderRadius: "4px", marginRight: "10px" }}>
          📊 Reports & Analytics
        </Link>
        {(userRole === "superadmin" || userRole === "admin") && (
          <Link to="/users" style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", textDecoration: "none", borderRadius: "4px" }}>
            Manage Users →
          </Link>
        )}
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
