// Local-only visual fixture. Requests are intercepted here; no real API writes occur.
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import HomePage from "../src/pages/home/HomePage";
import AdminShowcase from "../src/pages/admin/AdminShowcase";
import ShowcasePage from "../src/pages/promo/ShowcasePage";
import "../src/index.css";
import "../src/components/common/storefront.css";

const art = (color, mobile = false) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="1200" height="1200" fill="${color}"/><circle cx="${mobile ? 380 : 760}" cy="470" r="300" fill="#ffffff15"/><path d="M160 900L430 260L820 950Z" fill="#ffffff20"/></svg>`)}`;
const block = (n, shape, targetType) => ({ id: `b${n}`, shape, targetType, slug: `test-${n}`, externalUrl: "https://example.com", imageUrl: art(["#725647", "#354e4a", "#574256"][n % 3]), mobileImageUrl: art("#815c4c", true), productIds: [], imageAlt: `Sınaq şəkli ${n}` });
let groups = [
  { id: "g1", name: "Üçlü qrup", displayOrder: 1, isActive: true, version: "v1", blocks: [block(1, "square", "internal"), block(2, "square", "external"), block(3, "square", "none")] },
  { id: "g2", name: "Üfüqi şəkil", displayOrder: 2, isActive: true, version: "v2", blocks: [block(4, "landscape", "internal")] },
  { id: "g3", name: "İkili şaquli qrup", displayOrder: 3, isActive: true, version: "v3", blocks: [block(5, "portrait", "none"), block(6, "portrait", "external")] },
];
const products = Array.from({ length: 85 }, (_, i) => ({ id: `p${i + 1}`, name: `Sınaq məhsulu ${i + 1}`, productCode: `TEST${i + 1}`, price: 99, mainImageUrl: art("#dad6d1"), totalStock: 5 }));
window.fetch = async (url, options = {}) => {
  const parsed = new URL(url, location.origin); const path = parsed.pathname;
  let data = [];
  if (path === "/api/Showcase/active") data = groups;
  else if (path.startsWith("/api/Showcase/pages/")) data = { ...groups[0].blocks[0], title: "Adminin yazdığı başlıq", subtitle: "Adminin yazdığı alt mətn", description: "Birinci açıqlama.\nYeni sətirdə davam edən mətn.", products: products.slice(0, 4), afterProductsDescription: "Məhsullardan sonrakı açıqlama." };
  else if (path === "/api/AdminProducts") data = products;
  else if (path === "/api/AdminShowcaseGroups/order") { groups = JSON.parse(options.body).map((g, i) => ({ ...groups.find(x => x.id === g.id), displayOrder: i + 1 })); data = groups; }
  else if (path === "/api/AdminShowcaseGroups") data = groups;
  else if (path.startsWith("/api/AdminShowcaseGroups/")) data = groups.find(g => path.endsWith(g.id)) || groups[0];
  else if (path === "/api/Products/filter-options") data = { categories: [], brands: [], sizes: [], colors: [] };
  else if (path === "/api/Products") { const page = Number(parsed.searchParams.get("page") || 1); const size = Number(parsed.searchParams.get("pageSize") || 40); data = { items: products.slice((page - 1) * size, page * size), totalCount: products.length, totalPages: Math.ceil(products.length / size) }; }
  return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { "Content-Type": "application/json" } });
};
const view = new URLSearchParams(location.search).get("view");
const initial = view === "admin" ? "/Admin/showcase/g1" : view === "list" ? "/Admin/showcase" : view === "detail" ? "/test-1" : "/";
if (view === "admin" || view === "list") window.history.replaceState(null, "", initial);
createRoot(document.getElementById("root")).render(<LanguageProvider><MemoryRouter initialEntries={[initial]}><div style={{ fontFamily: "Arial, sans-serif", padding: view === "admin" || view === "list" ? 24 : 0, background: "#f8fafc", minHeight: "100vh" }}><Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/Admin/showcase" element={<AdminShowcase />} />
  <Route path="/Admin/showcase/create" element={<AdminShowcase mode="create" />} />
  <Route path="/Admin/showcase/:id" element={<AdminShowcase mode="edit" />} />
  <Route path="/:slug" element={<ShowcasePage />} />
</Routes></div></MemoryRouter></LanguageProvider>);
