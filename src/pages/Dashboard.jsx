import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { formatDate, parseFirestoreTimestamp } from "../utils/date";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const role = localStorage.getItem("role");
        setUserRole(role || "Agent");

        const [statsRes, ticketsRes] = await Promise.all([
          api.get("/tickets/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/tickets", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStats(statsRes.data);

        const recentTickets = [...ticketsRes.data]
          .sort((a, b) => parseFirestoreTimestamp(b.updatedAt) - parseFirestoreTimestamp(a.updatedAt))
          .slice(0, 6)
          .map((ticket) => {
            const createdAt = parseFirestoreTimestamp(ticket.createdAt);
            const updatedAt = parseFirestoreTimestamp(ticket.updatedAt);
            const isUpdated = updatedAt > createdAt;
            return {
              id: ticket.id,
              title: ticket.title,
              status: ticket.status,
              assignee: ticket.assignedToName || "Unassigned",
              timestamp: isUpdated ? updatedAt : createdAt,
              event: isUpdated ? "Updated" : "Created",
            };
          });

        setRecentActivities(recentTickets);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    navigate("/");
  };

  if (loading) return <p style={{ padding: "40px", fontSize: "18px" }}>Loading dashboard...</p>;
  if (error) return <p style={{ padding: "40px", color: "red", fontSize: "18px" }}>{error}</p>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f7fb" }}>
      <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "280px", backgroundColor: "#0f172a", color: "white", padding: "30px 20px", boxShadow: "2px 0 20px rgba(0,0,0,0.08)", overflowY: "auto" }}>
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "14px", backgroundColor: "#2563eb", display: "grid", placeItems: "center", fontWeight: "700", fontSize: "20px" }}>
              A
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Admin Desk</p>
              <p style={{ margin: 0, color: "#a5b4fc", fontSize: "13px" }}>Support workspace</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <p style={{ margin: "0 0 10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "12px" }}>
            Navigation
          </p>
          {renderSidebarLink("Dashboard", "/dashboard")}
          {renderSidebarLink("My Tickets", "/my-tickets")}
          {renderSidebarLink("All Tickets", "/tickets")}
          {renderSidebarLink("Reports", "/reports")}
          {(userRole === "superadmin" || userRole === "admin") && renderSidebarLink("Users", "/users")}
        </div>

        <div style={{ padding: "18px", backgroundColor: "#111827", borderRadius: "18px", border: "1px solid rgba(148, 163, 184, 0.12)" }}>
          <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>Role</p>
          <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>{userRole || "Agent"}</p>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: "280px", padding: "32px 40px 40px", overflowX: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Welcome back,</p>
            <h1 style={{ margin: "8px 0", fontSize: "36px", color: "red" }}>  🚀 NEW DASHBOARD LOADED 🚀</h1>
            <p style={{ margin: 0, color: "#475569", maxWidth: "640px", lineHeight: 1.6 }}>
              Monitor ticket health, agent activity, and recent support events using your live Firebase data.
            </p>
          </div>
          <button onClick={handleLogout} style={{ padding: "12px 20px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "999px", cursor: "pointer", fontWeight: 600 }}>
            Logout
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "24px" }}>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "20px" }}>
            <StatCard title="Total Tickets" value={stats?.totalTickets} accentColor="#334155" />
            <StatCard title="Open Tickets" value={stats?.openTickets} accentColor="#f97316" />
            <StatCard title="In Progress" value={stats?.inProgressTickets} accentColor="#0ea5e9" />
            <StatCard title="Resolved" value={stats?.resolvedTickets} accentColor="#10b981" />
            <StatCard title="Assigned" value={stats?.assignedTickets} accentColor="#6366f1" />
            <StatCard title="Unassigned" value={stats?.unassignedTickets} accentColor="#facc15" />
            <StatCard title="Total Users" value={stats?.totalUsers} accentColor="#64748b" />
            <StatCard title="Active Users" value={stats?.activeUsers} accentColor="#22c55e" />
          </section>

          <aside style={{ borderRadius: "24px", backgroundColor: "white", padding: "24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <p style={{ margin: 0, color: "#2563eb", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.18em" }}>Recent Activity</p>
                <h2 style={{ margin: "10px 0 0", fontSize: "22px", color: "#0f172a" }}>Latest support events</h2>
              </div>
              <span style={{ padding: "8px 12px", backgroundColor: "#e0f2fe", color: "#0369a1", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                {recentActivities.length} items
              </span>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {recentActivities.map((activity) => (
                <div key={activity.id} style={{ borderRadius: "18px", padding: "18px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{activity.event}</p>
                      <h3 style={{ margin: "8px 0 0", fontSize: "18px", color: "#0f172a" }}>{activity.title}</h3>
                    </div>
                    <span style={{ padding: "6px 12px", backgroundColor: activity.status === "resolved" ? "#d1fae5" : activity.status === "open" ? "#fee2e2" : "#e0f2fe", color: activity.status === "resolved" ? "#166534" : activity.status === "open" ? "#b91c1c" : "#0369a1", borderRadius: "999px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {activity.status}
                    </span>
                  </div>
                  <p style={{ margin: "14px 0 0", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                    Assigned to <strong>{activity.assignee}</strong>
                  </p>
                  <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: "13px" }}>
                    {formatDate(activity.timestamp, { hour: "numeric", minute: "numeric", hour12: true, month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div style={{ marginTop: "32px", display: "flex", flexWrap: "wrap", gap: "14px" }}>
          <Link to="/tickets" style={linkButtonStyle("#1d4ed8")}>Browse All Tickets</Link>
          <Link to="/my-tickets" style={linkButtonStyle("#0ea5e9")}>My Assigned Tickets</Link>
          <Link to="/reports" style={linkButtonStyle("#7c3aed")}>View Reports</Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, accentColor }) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)", borderTop: `4px solid ${accentColor}` }}>
      <p style={{ margin: 0, fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.14em" }}>{title}</p>
      <p style={{ margin: "16px 0 0", fontSize: "32px", fontWeight: 700, color: "#0f172a" }}>{value ?? "—"}</p>
    </div>
  );
}

function renderSidebarLink(label, to) {
  return (
    <Link
      key={to}
      to={to}
      style={{
        display: "block",
        padding: "12px 16px",
        marginBottom: "10px",
        borderRadius: "14px",
        textDecoration: "none",
        color: "#e2e8f0",
        backgroundColor: "transparent",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </Link>
  );
}

function linkButtonStyle(color) {
  return {
    padding: "14px 22px",
    backgroundColor: color,
    color: "white",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 600,
    minWidth: "180px",
    textAlign: "center",
  };
}
