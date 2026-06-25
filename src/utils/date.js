export const parseFirestoreTimestamp = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

export const formatDate = (value, options = { hour: "numeric", minute: "numeric", second: "numeric", hour12: true }) => {
  const date = parseFirestoreTimestamp(value);
  if (!date || Number.isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString(undefined, options);
};

export const formatDateOnly = (value, options) => {
  const date = parseFirestoreTimestamp(value);
  if (!date || Number.isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString(undefined, options);
};
