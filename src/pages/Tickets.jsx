import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTicket, setNewTicket] = useState({ title: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

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
      setNewTicket({ title: "", description: "" });
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

  if (loading) return <p>Loading...</p>;

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
          <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Create
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {tickets.length === 0 ? (
        <p>No tickets yet</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={tableHeaderStyle}>Title</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
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
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>
                <td style={tableCellStyle}>
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
    case "Open":
      return "#ffc107";
    case "In Progress":
      return "#17a2b8";
    case "Resolved":
      return "#28a745";
    default:
      return "#6c757d";
  }
}
