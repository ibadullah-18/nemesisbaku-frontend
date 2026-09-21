export function getDiscountInfo(priceValue, discountValue) {
  const price = Number(priceValue);
  const hasInput = discountValue !== "" && discountValue !== null && discountValue !== undefined;
  const discountPrice = hasInput ? Number(discountValue) : null;
  const valid =
    hasInput &&
    Number.isFinite(price) &&
    price > 0 &&
    Number.isFinite(discountPrice) &&
    discountPrice > 0 &&
    discountPrice < price;

  if (!valid) {
    return { hasInput, valid: false, price, discountPrice, amount: 0, percent: 0 };
  }

  const amount = price - discountPrice;
  const percent = Math.round((amount / price) * 100);

  return { hasInput, valid: true, price, discountPrice, amount, percent };
}
