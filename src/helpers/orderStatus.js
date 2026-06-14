export const ORDER_STATUS = {
  1: { key: "pending", color: "bg-amber-50 text-amber-700 border-amber-100" },
  2: { key: "confirmed", color: "bg-blue-50 text-blue-700 border-blue-100" },
  3: { key: "preparing", color: "bg-purple-50 text-purple-700 border-purple-100" },
  4: { key: "onDelivery", color: "bg-orange-50 text-orange-700 border-orange-100" },
  5: { key: "delivered", color: "bg-green-50 text-green-700 border-green-100" },
  6: { key: "cancelled", color: "bg-red-50 text-red-700 border-red-100" },
  7: { key: "rejected", color: "bg-red-50 text-red-700 border-red-100" },
};

export function getOrderStatus(status, text) {
  const item = ORDER_STATUS[Number(status)] || ORDER_STATUS[1];

  return {
    label: text?.orderStatuses?.[item.key] || item.key,
    color: item.color,
    key: item.key,
  };
}

export function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function money(value) {
  return Number(value || 0).toFixed(2).replace(".00", "");
}