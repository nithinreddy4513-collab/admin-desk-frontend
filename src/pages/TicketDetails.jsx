import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function TicketDetails() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      // Fetch all tickets and find the one we need
      try {
        const ticketsRes = await api.get("/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const foundTicket = ticketsRes.data.find((t) => t.id === ticketId);
        if (!foundTicket) {
          setError("Ticket not found");
          setLoading(false);
          return;
        }

        setTicket(foundTicket);

        // Fetch comments for this ticket
        try {
          const commentsRes = await api.get(`/tickets/${ticketId}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setComments(commentsRes.data);
        } catch (err) {
          console.error("No comments yet or error fetching comments");
        }

        // Fetch activities for this ticket
        try {
          const activitiesRes = await api.get(`/tickets/${ticketId}/activities`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setActivities(activitiesRes.data);
        } catch (err) {
          console.error("No activities yet or error fetching activities");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch ticket");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [ticketId, navigate]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(`/tickets/${ticketId}/comments`, { comment: newComment }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewComment("");

      // Refresh comments
      const commentsRes = await api.get(`/tickets/${ticketId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(commentsRes.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTicket({ ...ticket, status: newStatus });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading ticket...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;
  if (!ticket) return <p style={{ padding: "20px" }}>Ticket not found</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "20px",
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

      {/* Ticket Details */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid #ddd",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div>
            <label style={{ fontWeight: "bold", color: "#666" }}>Title</label>
            <p style={{ fontSize: "18px", margin: "5px 0" }}>{ticket.title}</p>
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: "#666" }}>Status</label>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: getStatusColor(ticket.status),
                color: "white",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div>
            <label style={{ fontWeight: "bold", color: "#666" }}>Priority</label>
            <p style={{
              padding: "8px",
              backgroundColor: getPriorityColor(ticket.priority),
              color: "white",
              borderRadius: "4px",
              width: "fit-content",
              fontSize: "12px",
              fontWeight: "bold",
            }}>
              {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: "#666" }}>Assigned To</label>
            <p style={{ fontSize: "16px", margin: "5px 0" }}>
              {ticket.assignedToName || "Unassigned"}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "bold", color: "#666" }}>Description</label>
          <p style={{
            backgroundColor: "white",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
          }}>
            {ticket.description}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ fontWeight: "bold", color: "#666" }}>Created</label>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: "#666" }}>Updated</label>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {new Date(ticket.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Timeline Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ borderBottom: "2px solid #6c757d", paddingBottom: "10px", marginBottom: "20px" }}>
          📋 Activity Timeline ({activities.length})
        </h2>

        {activities.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>No activities yet</p>
        ) : (
          <div style={{ position: "relative", paddingLeft: "30px" }}>
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                style={{
                  marginBottom: "20px",
                  position: "relative",
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-30px",
                    top: "5px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: getActivityColor(activity.action),
                    border: "3px solid white",
                    boxShadow: "0 0 0 2px #ddd",
                  }}
                />

                {/* Timeline content */}
                <div
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "12px",
                    borderRadius: "6px",
                    borderLeft: `4px solid ${getActivityColor(activity.action)}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div>
                      <p style={{ fontWeight: "bold", margin: "0", fontSize: "14px" }}>
                        {getActivityIcon(activity.action)} {activity.description}
                      </p>
                      <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
                        by {activity.performedBy}
                      </p>
                    </div>
                    <p style={{ fontSize: "12px", color: "#999", margin: "0", whiteSpace: "nowrap", marginLeft: "10px" }}>
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ borderBottom: "2px solid #007bff", paddingBottom: "10px", marginBottom: "20px" }}>
          💬 Comments ({comments.length})
        </h2>

        {/* Comments List */}
        <div style={{ marginBottom: "20px", maxHeight: "400px", overflowY: "auto" }}>
          {comments.length === 0 ? (
            <p style={{ color: "#999", fontStyle: "italic" }}>No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                  borderLeft: "4px solid #007bff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <p style={{ fontWeight: "bold", margin: "0" }}>
                    {comment.userName}
                  </p>
                  <p style={{ fontSize: "12px", color: "#999", margin: "0" }}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
                <p style={{ margin: "0", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                  {comment.comment}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>
            Add a Comment
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type your comment here..."
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              boxSizing: "border-box",
              minHeight: "80px",
              marginBottom: "10px",
            }}
          />
          <button
            type="submit"
            disabled={submittingComment}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {submittingComment ? "Submitting..." : "Post Comment"}
          </button>
        </form>
      </div>
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

function getActivityIcon(action) {
  switch (action) {
    case "ticket_created":
      return "🟢";
    case "assigned":
      return "👤";
    case "unassigned":
      return "🔓";
    case "status_changed":
      return "🔄";
    case "comment_added":
      return "💬";
    default:
      return "📌";
  }
}

function getActivityColor(action) {
  switch (action) {
    case "ticket_created":
      return "#28a745";
    case "assigned":
      return "#007bff";
    case "unassigned":
      return "#6c757d";
    case "status_changed":
      return "#17a2b8";
    case "comment_added":
      return "#ffc107";
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
