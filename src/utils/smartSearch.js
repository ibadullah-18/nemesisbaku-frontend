
import { apiFetch } from "../api/apiFetch";

export function fold(value) {
  return String(value ?? "")
    .replace(/[İIı]/g, "i")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/ə/g, "e")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function rankProducts(items, query) {
  const q = fold(query);
  const tokens = q.split(" ").filter(Boolean);
  if (!tokens.length) return [];

  return items.map((product, index) => {
    const name = fold(
      product.name || product.productName || product.model
    );
    const code = fold(product.productCode || product.code);

    const searchable = fold([
      name,
      code,
      product.brandName,
      product.brand?.name,
      product.categoryName,
      product.category?.name,
      product.model
    ].filter(Boolean).join(" "));

    if (!tokens.every(token => searchable.includes(token))) {
      return null;
    }

    const score =
      (code === q ? 100 : 0) +
      (name === q ? 80 : 0) +
      (name.startsWith(q) ? 40 : 0) +
      tokens.reduce((sum, token) =>
        sum + (
          name.split(" ").some(word => word.startsWith(token))
            ? 5
            : 0
        ), 0);

    return { product, index, score };
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.product);
}

const cache = new Map();

function unpack(response) {
  const data = response?.data?.data ?? response?.data ?? response;

  return {
    data,
    items: Array.isArray(data)
      ? data
      : (data?.items || data?.products || data?.result || [])
  };
}

export async function searchCatalog(query, filters = {}) {
  const pairs = Object.entries(filters)
    .filter(([key, value]) =>
      !["page", "pageSize", "search"].includes(key) &&
      value !== null &&
      value !== undefined &&
      value !== ""
    )
    .sort(([a], [b]) => a.localeCompare(b));

  const key = JSON.stringify(pairs);
  let entry = cache.get(key);

  if (!entry || Date.now() - entry.time > 60000) {
    const promise = (async () => {
      const products = new Map();
      let complete = false;

      for (let page = 1; page <= 10; page++) {
        const params = new URLSearchParams(pairs);
        params.set("page", String(page));
        params.set("pageSize", "100");

        const response = await apiFetch("/api/Products?" + params);
        const { data, items } = unpack(response);

        if (!Array.isArray(items)) {
          throw Error("Invalid product response");
        }

        const previousSize = products.size;

        for (const item of items) {
          const id = item.id || item.productId;
          if (id) products.set(String(id), { ...item, id });
        }

        const total = Number(
          data?.totalCount ?? data?.totalItems ?? data?.total
        );

        if (
          items.length === 0 ||
          (Number.isFinite(total) && products.size >= total)
        ) {
          complete = true;
          break;
        }

        if (products.size === previousSize) break;

        if (
          Number(data?.totalPages) > 0 &&
          page >= Number(data.totalPages)
        ) {
          complete = true;
          break;
        }
      }

      return {
        items: [...products.values()],
        partial: !complete
      };
    })();

    entry = { promise, time: Date.now() };
    cache.set(key, entry);

    if (cache.size > 4) {
      cache.delete(cache.keys().next().value);
    }

    promise.catch(() => {
      if (cache.get(key) === entry) cache.delete(key);
    });
  }

  const data = await entry.promise;

  return {
    ...data,
    items: fold(query) ? rankProducts(data.items, query) : data.items
  };
}
