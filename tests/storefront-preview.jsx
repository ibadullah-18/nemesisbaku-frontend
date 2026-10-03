// Isolated visual fixture: no account creation, analytics, or real API calls.
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import ProductCard from "../src/components/product/ProductCard";
import HomePromoSlider from "../src/components/home/HomePromoSlider";
import LoginPage from "../src/pages/auth/LoginPage";
import RegisterPage from "../src/pages/auth/RegisterPage";
import ForgotPasswordPage from "../src/pages/auth/ForgotPasswordPage";
import "../src/index.css";
import "../src/components/common/storefront.css";

window.fetch = async url => {
  if (String(url).includes("/api/StoreInfo")) return new Response(JSON.stringify({ data: { storeName: "nemesisbaku" } }), { status: 200 });
  if (/\/api\/Auth\/send-(register|forgot-password)-otp$/.test(String(url))) return new Response(JSON.stringify({ success: true }), { status: 200 });
  throw new Error("No real network requests in preview");
};
const art = (color, number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720"><rect width="600" height="720" fill="${color}"/><text x="300" y="360" fill="white" text-anchor="middle" font-family="Arial" font-size="110">${number}</text></svg>`)}`;
const images = [art("#756455", 1), art("#536960", 2), art("#555c77", 3)];
const product = { id: "preview", name: "Məhsul", price: 99, images, mainImageUrl: images[0] };
const view = new URLSearchParams(location.search).get("view");
createRoot(document.getElementById("root")).render(<LanguageProvider><MemoryRouter initialEntries={[view === "login" ? "/login" : view === "register" ? "/register" : view === "forgot" ? "/forgot-password" : "/"]}><div className="nb-storefront"><Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/" element={<><HomePromoSlider promos={images.map((imageUrl, i) => ({ id: String(i), imageUrl }))} /><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, maxWidth: 650, margin: "20px auto", padding: 14 }}><ProductCard product={product} /><ProductCard product={{ ...product, id: "single", images: [images[0]] }} /></div></>} />
  <Route path="/products/:id" element={<h1>Product link opened</h1>} />
  <Route path="/promo/:id" element={<h1>Campaign link opened</h1>} />
</Routes></div></MemoryRouter></LanguageProvider>);
