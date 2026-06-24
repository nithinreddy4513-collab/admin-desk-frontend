import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      // Get user info from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      // Get user name from localStorage (set during login)
      const storedUserName = localStorage.getItem("fullName");
      setUserName(storedUserName || "Agent");

      await fetchMyTickets();
    };
    init();
  }, [navigate]);

  const fetchMyTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await api.get("/tickets/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch your tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/tickets/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMyTickets();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  // Filter and search tickets
  const getFilteredTickets = () => {
    return tickets.filter((ticket) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;

      // Priority filter
      const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading your tickets...</p>;

  const filteredTickets = getFilteredTickets();
  const myOpenTickets = tickets.filter((t) => t.status === "open").length;
  const myInProgressTickets = tickets.filter((t) => t.status === "in-progress").length;
  const myResolvedTickets = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Tickets</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>Welcome, {userName}</p>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "30px" }}>
        <StatCard title="My Open" value={myOpenTickets} color="#ffc107" />
        <StatCard title="In Progress" value={myInProgressTickets} color="#17a2b8" />
        <StatCard title="Resolved" value={myResolvedTickets} color="#28a745" />
        <StatCard title="Total Assigned" value={tickets.length} color="#007bff" />
      </div>

      {/* Search and Filter Bar */}
      <div style={{
        marginBottom: "20px",
        padding: "15px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr",
        gap: "10px",
      }}>
        <input
          type="text"
          placeholder="🔍 Search your tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {filteredTickets.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>
          {searchQuery || filterStatus !== "all" || filterPriority !== "all"
            ? "No tickets match your filters"
            : "No tickets assigned to you"}
        </p>
      ) : (
        <>
          <p style={{ color: "#666", marginBottom: "10px" }}>
            Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> tickets
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={tableHeaderStyle}>Title</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Priority</th>
                <th style={tableHeaderStyle}>Created</th>
                <th style={tableHeaderStyle}>Updated</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={tableCellStyle}>{ticket.title}</td>
                  <td style={tableCellStyle}>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      style={{
                        padding: "5px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: getStatusColor(ticket.status),
                        color: "white",
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: "4px 8px",
                      backgroundColor: getPriorityColor(ticket.priority),
                      color: "white",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : "N/A"}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td style={tableCellStyle}>{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ marginTop: "20px" }}>
        <a href="/dashboard" style={{ color: "#007bff", textDecoration: "none", marginRight: "20px" }}>
          ← Back to Dashboard
        </a>
        <a href="/tickets" style={{ color: "#007bff", textDecoration: "none" }}>
          View All Tickets →
        </a>
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  textAlign: "left",
  padding: "12px",
  backgroundColor: "#f8f9fa",
  fontWeight: "bold",
  borderBottom: "2px solid #ddd",
};

const tableCellStyle = {
  padding: "12px",
  textAlign: "left",
};

function StatCard({ title, value, color }) {
  return (
    <div style={{ backgroundColor: color, color: "white", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
      <p style={{ margin: "0 0 10px 0", fontSize: "12px", opacity: "0.9" }}>{title}</p>
      <p style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>{value}</p>
    </div>
  );
}

function getStatusColor(status) {
  switch (status) {
    case "open":
      return "#ffc107";
    case "in-progress":
      return "#17a2b8";
    case "resolved":
      return "#28a745";
    default:
      return "#6c757d";
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case "low":
      return "#28a745";
    case "medium":
      return "#ffc107";
    case "high":
      return "#dc3545";
    default:
      return "#6c757d";
  }
}
