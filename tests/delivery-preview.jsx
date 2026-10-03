// Local-only fixture: all data is fake and no API request leaves this page.
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import useDeliveryQuote from "../src/hooks/useDeliveryQuote";
import { ordersApi } from "../src/api/ordersApi";
import { adminMetroStationsApi } from "../src/api/admin/adminApi";
import AdminMetroStations from "../src/pages/admin/AdminMetroStations";
import "../src/index.css";

window.fetch = async () => { throw new Error("Unexpected network request in local fixture"); };
let stations = [{ id: "test", version: "v1", name: "28 May", latitude: 40.379712, longitude: 49.848843, address: "Dilarə Əliyeva küçəsi — Çıxış 1", isActive: true }];
adminMetroStationsApi.list = async () => ({ data: stations });
adminMetroStationsApi.save = async (id, data) => { const saved = { ...data, id: id || "test-new", version: "v2" }; stations = [...stations.filter(s => s.id !== saved.id), saved]; return { data: saved }; };
const root = createRoot(document.getElementById("root"));
if (new URLSearchParams(location.search).get("view") === "admin") {
  root.render(<div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}><AdminMetroStations /></div>);
} else {
  window.IS_REACT_ACT_ENVIRONMENT = true;
  const requests = [];
  ordersApi.calculateDelivery = (body, options) => new Promise((resolve, reject) => requests.push({ body, options, resolve, reject }));
  let quote;
  function Harness(props) { quote = useDeliveryQuote(props); return <pre>{JSON.stringify({ pending: quote.pending, available: quote.available, price: quote.deliveryPrice })}</pre>; }
  const results = [];
  const check = (condition, label) => { if (!condition) throw new Error(label); results.push(label); };
  const render = async props => { await act(async () => { root.render(<Harness {...props} />); }); };
  const wait = async () => { await act(async () => { await new Promise(r => setTimeout(r, 240)); }); };
  const resolve = async (index, price) => { await act(async () => { requests[index].resolve({ data: { deliveryPrice: price } }); }); };
  const home = { deliveryType: 1, latitude: 40, longitude: 49 };
  try {
    await render(home); check(quote.pending && !quote.available, "Initial quote blocks submission"); await wait();
    await render({ ...home, latitude: 41 }); check(quote.pending, "Map movement invalidates price"); await wait();
    await resolve(1, 7); check(quote.available && quote.deliveryPrice === 7, "Latest quote accepted");
    await resolve(0, 6); check(quote.deliveryPrice === 7, "Late old response ignored");
    await render(home); check(quote.pending, "Returning to a point requires fresh quote"); await wait();
    await act(async () => { requests[2].reject(new Error("Offline")); }); check(!quote.available && !quote.pending, "Failure blocks submission");
    await act(async () => { quote.retry(); }); check(quote.pending, "Retry enters pending state"); await wait(); await resolve(3, 6);
    check(quote.available && quote.deliveryPrice === 6, "Retry recovers");
    await render({ deliveryType: 3, metroStationId: "" }); check(!quote.available && !quote.pending, "Metro selection required");
    await render({ deliveryType: 3, metroStationId: "test" }); await wait(); await resolve(4, 4);
    check(quote.available && quote.deliveryPrice === 4 && requests[4].body.metroStationId === "test", "Metro pickup quote");
    await render({ deliveryType: 2 }); check(quote.available && quote.deliveryPrice === 0, "Store pickup remains free");
    window.IS_REACT_ACT_ENVIRONMENT = false;
    root.render(<main><h1>PASS: {results.length} delivery checks</h1><ul>{results.map(x => <li key={x}>{x}</li>)}</ul></main>);
  } catch (error) { window.IS_REACT_ACT_ENVIRONMENT = false; root.render(<h1>FAIL: {error.message}</h1>); }
}
