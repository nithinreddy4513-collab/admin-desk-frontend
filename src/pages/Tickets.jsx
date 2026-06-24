import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "low" });
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignedTo, setFilterAssignedTo] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await fetchUsers();
      await fetchTickets();
    };
    init();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter to only active agents and admins
      const activeUsers = response.data.filter(
        (user) => user.isActive && (user.role === "agent" || user.role === "admin")
      );
      setUsers(activeUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await api.get("/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await api.post("/tickets", newTicket, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewTicket({ title: "", description: "", priority: "low" });
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create ticket");
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete ticket");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/tickets/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleAssignTicket = async (id, userId) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/tickets/${id}/assign`, { assignedTo: userId || null }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to assign ticket");
    }
  };

  // Filter and search tickets
  const getFilteredTickets = () => {
    return tickets.filter((ticket) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        (ticket.assignedToName && ticket.assignedToName.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;

      // Priority filter
      const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;

      // Assigned To filter
      const matchesAssignedTo =
        filterAssignedTo === "all" ||
        (filterAssignedTo === "unassigned" && !ticket.assignedTo) ||
        ticket.assignedTo === filterAssignedTo;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo;
    });
  };

  if (loading) return <p>Loading...</p>;

  const filteredTickets = getFilteredTickets();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Tickets</h1>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {showForm ? "Cancel" : "+ Create Ticket"}
      </button>

      {/* Search and Filter Bar */}
      <div style={{
        marginBottom: "20px",
        padding: "15px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: "10px",
      }}>
        <input
          type="text"
          placeholder="🔍 Search tickets..."
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
        <select
          value={filterAssignedTo}
          onChange={(e) => setFilterAssignedTo(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        >
          <option value="all">All Users</option>
          <option value="unassigned">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleCreateTicket} style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <input
            type="text"
            placeholder="Title"
            value={newTicket.title}
            onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            required
            style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
          <textarea
            placeholder="Description"
            value={newTicket.description}
            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            required
            style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", minHeight: "80px" }}
          />
          <select
            value={newTicket.priority}
            onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Create
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {filteredTickets.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>
          {searchQuery || filterStatus !== "all" || filterPriority !== "all" || filterAssignedTo !== "all"
            ? "No tickets match your filters"
            : "No tickets yet"}
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
                <th style={tableHeaderStyle}>Assigned To</th>
                <th style={tableHeaderStyle}>Created</th>
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
                  <td style={tableCellStyle}>
                    <select
                      value={ticket.assignedTo || ""}
                      onChange={(e) => handleAssignTicket(ticket.id, e.target.value || null)}
                      style={{
                        padding: "5px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: ticket.assignedTo ? "#d4edda" : "#fff3cd",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tableCellStyle}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
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
                        marginRight: "5px",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ marginTop: "20px" }}>
        <a href="/dashboard" style={{ color: "#007bff", textDecoration: "none" }}>
          ← Back to Dashboard
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
