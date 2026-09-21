export const ORDER_STATUSES = [
  { value: 1, label: "Yeni sifariş", tone: "pending" },
  { value: 2, label: "Qəbul olundu", tone: "confirmed" },
  { value: 3, label: "Hazırlanır", tone: "preparing" },
  { value: 4, label: "Çatdırılmada", tone: "delivery" },
  { value: 5, label: "Çatdırıldı", tone: "delivered" },
  { value: 6, label: "Ləğv edildi", tone: "cancelled" },
  { value: 7, label: "Rədd edildi", tone: "rejected" },
];

const TRANSITIONS = {
  1: [2, 6, 7],
  2: [3, 4, 6, 7],
  3: [4, 6, 7],
  4: [5, 6],
  5: [],
  6: [],
  7: [],
};

export function availableOrderStatuses(status) {
  return (TRANSITIONS[Number(status)] || []).map((value) =>
    ORDER_STATUSES.find((option) => option.value === value),
  );
}

export function getOrderStatus(status) {
  return ORDER_STATUSES.find((option) => option.value === Number(status)) || {
    value: status, label: "Naməlum status", tone: "unknown",
  };
}

export function formatOrderDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 16);
  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function orderMoney(value) {
  return new Intl.NumberFormat("az-AZ", {
    style: "currency", currency: "AZN",
  }).format(Number(value) || 0);
}

export function orderDeliveryType(value) {
  if (Number(value) === 1) return "Ünvana çatdırılma";
  if (Number(value) === 2) return "Mağazadan götürmə";
  return "—";
}
