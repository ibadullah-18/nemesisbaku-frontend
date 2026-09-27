
const marker = /(?:^|\n)\[NB-LOYALTY:([0-9]{1,32})\]$/;

export function cleanCard(value) {
  const code = String(value ?? "").trim();
  return /^[0-9]{1,32}$/.test(code) ? code : "";
}

export function orderCard(order) {
  return cleanCard(order?.loyaltyCardCode)
    || String(order?.note || "").trim().match(marker)?.[1]
    || "";
}

export function customerNote(note) {
  return String(note || "").trim().replace(marker, "").trim();
}

export function noteWithCard(note, code) {
  const text = customerNote(note);
  const card = cleanCard(code);

  return card
    ? [text, "[NB-LOYALTY:" + card + "]"].filter(Boolean).join("\n")
    : text;
}
