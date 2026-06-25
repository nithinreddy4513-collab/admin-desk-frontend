import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { formatDate, parseFirestoreTimestamp } from "../utils/date";

export default function Reports() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        // Fetch tickets and users
        const [ticketsRes, usersRes] = await Promise.all([
          api.get("/tickets", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/users", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setTickets(ticketsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const metrics = {
      totalTickets: tickets.length,
      openTickets: tickets.filter((t) => t.status === "open").length,
      inProgressTickets: tickets.filter((t) => t.status === "in-progress").length,
      resolvedTickets: tickets.filter((t) => t.status === "resolved").length,
      ticketsCreatedToday: tickets.filter(
        (t) => parseFirestoreTimestamp(t.createdAt) >= today
      ).length,
      ticketsCreatedThisWeek: tickets.filter(
        (t) => parseFirestoreTimestamp(t.createdAt) >= weekAgo
      ).length,
      ticketsResolvedToday: tickets.filter(
        (t) => t.status === "resolved" && parseFirestoreTimestamp(t.updatedAt) >= today
      ).length,
      ticketsResolvedThisWeek: tickets.filter(
        (t) => t.status === "resolved" && parseFirestoreTimestamp(t.updatedAt) >= weekAgo
      ).length,
      activeUsers: users.filter((u) => u.isActive).length,
    };

    // Calculate average resolution time
    const resolvedTickets = tickets.filter((t) => t.status === "resolved");
    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const created = parseFirestoreTimestamp(ticket.createdAt);
        const updated = parseFirestoreTimestamp(ticket.updatedAt);
        const timeInMinutes = (updated - created) / (1000 * 60);
        return sum + timeInMinutes;
      }, 0);
      avgResolutionTime = (totalTime / resolvedTickets.length / 60).toFixed(1); // Convert to hours
    }

    // Find oldest open ticket
    const openTickets = tickets.filter((t) => t.status === "open");
    let oldestOpenTicket = null;
    if (openTickets.length > 0) {
      oldestOpenTicket = openTickets.reduce((oldest, current) => {
        return parseFirestoreTimestamp(current.createdAt) < parseFirestoreTimestamp(oldest.createdAt)
          ? current
          : oldest;
      });
    }

    // Fastest resolution time
    let fastestResolutionTime = null;
    if (resolvedTickets.length > 0) {
      const fastest = resolvedTickets.reduce((min, ticket) => {
        const created = parseFirestoreTimestamp(ticket.createdAt);
        const updated = parseFirestoreTimestamp(ticket.updatedAt);
        const timeInHours = (updated - created) / (1000 * 60 * 60);
        return timeInHours < min.time ? { ticket, time: timeInHours } : min;
      }, { time: Infinity });
      fastestResolutionTime = fastest.time === Infinity ? null : fastest.time.toFixed(1);
    }

    return {
      ...metrics,
      avgResolutionTime,
      oldestOpenTicket,
      fastestResolutionTime,
    };
  };

  // Calculate agent performance
  const getAgentPerformance = () => {
    const performance = {};

    // Count tickets by assigned agent
    tickets.forEach((ticket) => {
      if (ticket.assignedTo && ticket.assignedToName) {
        if (!performance[ticket.assignedTo]) {
          performance[ticket.assignedTo] = {
            name: ticket.assignedToName,
            assigned: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
          };
        }
        performance[ticket.assignedTo].assigned++;
        if (ticket.status === "open") performance[ticket.assignedTo].open++;
        else if (ticket.status === "in-progress")
          performance[ticket.assignedTo].inProgress++;
        else if (ticket.status === "resolved")
          performance[ticket.assignedTo].resolved++;
      }
    });

    return Object.values(performance).sort((a, b) => b.assigned - a.assigned);
  };

  // Get status distribution
  const getStatusDistribution = () => {
    return [
      {
        name: "Open",
        count: tickets.filter((t) => t.status === "open").length,
        color: "#ffc107",
      },
      {
        name: "In Progress",
        count: tickets.filter((t) => t.status === "in-progress").length,
        color: "#17a2b8",
      },
      {
        name: "Resolved",
        count: tickets.filter((t) => t.status === "resolved").length,
        color: "#28a745",
      },
    ];
  };

  // Get priority distribution
  const getPriorityDistribution = () => {
    return [
      {
        name: "Low",
        count: tickets.filter((t) => t.priority === "low").length,
        color: "#28a745",
      },
      {
        name: "Medium",
        count: tickets.filter((t) => t.priority === "medium").length,
        color: "#ffc107",
      },
      {
        name: "High",
        count: tickets.filter((t) => t.priority === "high").length,
        color: "#dc3545",
      },
    ];
  };

  // Get weekly trend
  const getWeeklyTrend = () => {
    const now = new Date();
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const trend = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const count = tickets.filter(
        (t) =>
          parseFirestoreTimestamp(t.createdAt) >= dayStart && parseFirestoreTimestamp(t.createdAt) < dayEnd
      ).length;

      trend.push({
        day: days[date.getDay()],
        count,
      });
    }

    return trend;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Ticket ID", "Title", "Status", "Priority", "Assigned To", "Created", "Updated"];
    const rows = tickets.map((ticket) => [
      ticket.id,
      ticket.title,
      ticket.status,
      ticket.priority,
      ticket.assignedToName || "Unassigned",
      formatDate(ticket.createdAt),
      formatDate(ticket.updatedAt),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tickets-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading reports...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;

  const metrics = calculateMetrics();
  const agentPerformance = getAgentPerformance();
  const statusDistribution = getStatusDistribution();
  const priorityDistribution = getPriorityDistribution();
  const weeklyTrend = getWeeklyTrend();

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>📊 Reports & Analytics</h1>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 15px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>

      {/* Export Button */}
      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={exportToCSV}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          📥 Export to CSV
        </button>
      </div>

      {/* KPI Cards - Section 1 */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ borderBottom: "2px solid #007bff", paddingBottom: "10px", marginBottom: "20px" }}>
          📈 Overall Metrics
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <KPICard title="Total Tickets" value={metrics.totalTickets} color="#007bff" />
          <KPICard title="Open" value={metrics.openTickets} color="#ffc107" />
          <KPICard title="In Progress" value={metrics.inProgressTickets} color="#17a2b8" />
          <KPICard title="Resolved" value={metrics.resolvedTickets} color="#28a745" />
        </div>
      </div>

      {/* KPI Cards - Section 2 */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ borderBottom: "2px solid #28a745", paddingBottom: "10px", marginBottom: "20px" }}>
          📅 Today & This Week
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <KPICard title="Created Today" value={metrics.ticketsCreatedToday} color="#007bff" />
          <KPICard title="Created This Week" value={metrics.ticketsCreatedThisWeek} color="#17a2b8" />
          <KPICard title="Resolved Today" value={metrics.ticketsResolvedToday} color="#28a745" />
          <KPICard title="Resolved This Week" value={metrics.ticketsResolvedThisWeek} color="#20c997" />
        </div>
      </div>

      {/* Resolution Metrics */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ borderBottom: "2px solid #17a2b8", paddingBottom: "10px", marginBottom: "20px" }}>
          ⏱️ Resolution Metrics
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          <MetricBox
            title="Average Resolution Time"
            value={`${metrics.avgResolutionTime} hours`}
            description={`Based on ${tickets.filter((t) => t.status === "resolved").length} resolved tickets`}
            color="#17a2b8"
          />
          <MetricBox
            title="Fastest Resolution"
            value={metrics.fastestResolutionTime ? `${metrics.fastestResolutionTime} hours` : "N/A"}
            description="Quickest ticket resolution"
            color="#28a745"
          />
          {metrics.oldestOpenTicket && (
            <MetricBox
              title="Oldest Open Ticket"
              value={metrics.oldestOpenTicket.title}
              description={`Created ${Math.floor(
                (new Date() - parseFirestoreTimestamp(metrics.oldestOpenTicket.createdAt)) / (1000 * 60 * 60)
              )} hours ago`}
              color="#dc3545"
            />
          )}
        </div>
      </div>

      {/* Agent Performance */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ borderBottom: "2px solid #ffc107", paddingBottom: "10px", marginBottom: "20px" }}>
          👥 Agent Performance
        </h2>
        {agentPerformance.length === 0 ? (
          <p style={{ color: "#999" }}>No agents assigned yet</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={tableHeaderStyle}>Agent Name</th>
                  <th style={tableHeaderStyle}>Total Assigned</th>
                  <th style={tableHeaderStyle}>Open</th>
                  <th style={tableHeaderStyle}>In Progress</th>
                  <th style={tableHeaderStyle}>Resolved</th>
                  <th style={tableHeaderStyle}>Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((agent) => {
                  const total = agent.assigned;
                  const resolutionRate =
                    total > 0
                      ? ((agent.resolved / total) * 100).toFixed(1)
                      : 0;
                  return (
                    <tr key={agent.name} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={tableCellStyle}>{agent.name}</td>
                      <td style={tableCellStyle}>{agent.assigned}</td>
                      <td style={tableCellStyle}>
                        <span style={{ color: "#ffc107", fontWeight: "bold" }}>
                          {agent.open}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ color: "#17a2b8", fontWeight: "bold" }}>
                          {agent.inProgress}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ color: "#28a745", fontWeight: "bold" }}>
                          {agent.resolved}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            padding: "4px 8px",
                            backgroundColor: resolutionRate > 70 ? "#28a745" : "#ffc107",
                            color: "white",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          {resolutionRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distribution Charts */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ borderBottom: "2px solid #dc3545", paddingBottom: "10px", marginBottom: "20px" }}>
          📊 Distribution
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          {/* Status Distribution */}
          <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
            <h3 style={{ marginTop: "0", marginBottom: "20px", textAlign: "center" }}>By Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {statusDistribution.map((item) => (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontWeight: "bold" }}>{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div style={{ backgroundColor: "#e9ecef", borderRadius: "4px", overflow: "hidden", height: "20px" }}>
                    <div
                      style={{
                        backgroundColor: item.color,
                        height: "100%",
                        width: `${
                          metrics.totalTickets > 0
                            ? (item.count / metrics.totalTickets) * 100
                            : 0
                        }%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
            <h3 style={{ marginTop: "0", marginBottom: "20px", textAlign: "center" }}>By Priority</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {priorityDistribution.map((item) => (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontWeight: "bold" }}>{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div style={{ backgroundColor: "#e9ecef", borderRadius: "4px", overflow: "hidden", height: "20px" }}>
                    <div
                      style={{
                        backgroundColor: item.color,
                        height: "100%",
                        width: `${
                          metrics.totalTickets > 0
                            ? (item.count / metrics.totalTickets) * 100
                            : 0
                        }%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ borderBottom: "2px solid #17a2b8", paddingBottom: "10px", marginBottom: "20px" }}>
          📈 Weekly Trend (Last 7 Days)
        </h2>
        <div style={{ backgroundColor: "#f8f9fa", padding: "30px", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "15px", height: "200px", justifyContent: "space-around" }}>
            {weeklyTrend.map((item) => {
              const maxCount = Math.max(...weeklyTrend.map((d) => d.count), 1);
              const barHeight = (item.count / maxCount) * 150;
              return (
                <div
                  key={item.day}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: `${barHeight}px`,
                      backgroundColor: "#007bff",
                      borderRadius: "4px",
                      transition: "all 0.3s ease",
                    }}
                  />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>{item.day}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>{item.count}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, color }) {
  return (
    <div
      style={{
        backgroundColor: color,
        color: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ margin: "0 0 10px 0", opacity: 0.9, fontSize: "14px" }}>
        {title}
      </p>
      <p style={{ margin: "0", fontSize: "32px", fontWeight: "bold" }}>
        {value}
      </p>
    </div>
  );
}

function MetricBox({ title, value, description, color }) {
  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        border: `3px solid ${color}`,
        padding: "20px",
        borderRadius: "8px",
      }}
    >
      <p style={{ margin: "0", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
        {title}
      </p>
      <p
        style={{
          margin: "10px 0",
          fontSize: "24px",
          fontWeight: "bold",
          color: color,
        }}
      >
        {value}
      </p>
      <p style={{ margin: "0", fontSize: "12px", color: "#999" }}>
        {description}
      </p>
    </div>
  );
}

const tableHeaderStyle = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "bold",
  color: "#333",
  borderBottom: "2px solid #dee2e6",
};

const tableCellStyle = {
  padding: "12px",
  borderBottom: "1px solid #dee2e6",
  color: "#333",
};
