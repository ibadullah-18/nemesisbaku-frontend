export const SHOWCASE_INTERVAL = 15;
export const HOME_PAGE_SIZE = 40;
export function hasNextHomePage(response, receivedCount, page) {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Number.isFinite(data?.totalPages)) return page < data.totalPages;
  if (Number.isFinite(data?.totalCount)) return page * HOME_PAGE_SIZE < data.totalCount;
  return receivedCount >= HOME_PAGE_SIZE;
}
export const SHOWCASE_SHAPES = {
  square: { label: "Kvadrat", ratio: "1 / 1", desktop: "1200 × 1200", mobile: "900 × 900" },
  portrait: { label: "Şaquli düzbucaqlı", ratio: "3 / 4", desktop: "1200 × 1600", mobile: "900 × 1200" },
  landscape: { label: "Üfüqi düzbucaqlı", ratio: "2 / 1", desktop: "1800 × 900", mobile: "1000 × 500" },
};

export function showcaseHref(block) {
  const slug = String(block?.slug || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  if (block?.targetType === "internal" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return `/${slug}`;
  if (block?.targetType !== "external") return null;
  try {
    const url = new URL(block.externalUrl);
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password &&
      ![...block.externalUrl].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 || char === "\\")) return url.href;
  } catch { /* Invalid links render as a noninteractive image. */ }
  return null;
}

export function showcaseAfterProduct(groups, count) {
  if (count <= 0 || count % SHOWCASE_INTERVAL !== 0) return null;
  return groups[Math.floor(count / SHOWCASE_INTERVAL) - 1] || null;
}

export function toShowcaseFormData(form) {
  const body = new FormData();
  for (const key of ["name", "displayOrder", "isActive", "version"]) {
    if (form[key] != null) body.append(key, String(form[key]));
  }
  form.blocks.forEach((block, i) => {
    for (const key of ["id", "shape", "targetType", "slug", "externalUrl", "imageAlt", "title", "subtitle", "description", "afterProductsDescription"]) {
      if (block[key] != null) body.append(`blocks[${i}].${key}`, block[key]);
    }
    (block.productIds || []).forEach((id, p) => body.append(`blocks[${i}].productIds[${p}]`, id));
    if (block.file) body.append(`blocks[${i}].file`, block.file);
    if (block.mobileFile) body.append(`blocks[${i}].mobileFile`, block.mobileFile);
  });
  return body;
}
