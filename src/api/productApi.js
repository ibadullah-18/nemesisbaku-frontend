import { apiFetch } from "./apiFetch";

export function getFilterOptions() {
  return apiFetch("/api/Products/filter-options");
}

export function getProducts(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.categoryId) params.append("categoryId", filters.categoryId);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.sizeId) params.append("sizeId", filters.sizeId);
  if (filters.colorId) params.append("colorId", filters.colorId);
  if (filters.minPrice) params.append("minPrice", filters.minPrice);
  if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
  if (filters.isDiscounted !== undefined) {
    params.append("isDiscounted", filters.isDiscounted);
  }

  const query = params.toString();

  return apiFetch(`/api/Products${query ? `?${query}` : ""}`);
}