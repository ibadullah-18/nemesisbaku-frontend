import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiMapPin, FiSave } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import AppLoader from "../../components/common/AppLoader";
import { basketApi } from "../../api/basketApi";
import { ordersApi } from "../../api/ordersApi";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";

const BAKU = [40.4093, 49.8671];
const STORE_WHATSAPP_NUMBER = "994514349829";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function money(v) {
  return Number(v || 0).toFixed(2).replace(".00", "");
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [items, setItems] = useState([]);
  const [promo, setPromo] = useState({ code: "", discountAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerFullName: "",
    customerPhoneNumber: "",
    deliveryType: 1,
    paymentMethod: 1,
    addressText: "",
    latitude: BAKU[0],
    longitude: BAKU[1],
    buildingNumber: "",
    floor: "",
    apartment: "",
    deliveryDate: "",
    deliveryTimeRange: "12:00-15:00",
    note: "",
  });

  const [error, setError] = useState("");

  const productTotal = useMemo(
    () => items.reduce((s, x) => s + Number(x.totalPrice || 0), 0),
    [items]
  );

  const originalTotal = useMemo(
    () =>
      items.reduce(
        (s, x) =>
          s +
          Number(
            x.originalTotalPrice ??
              Number(x.originalPrice || x.unitPrice || 0) *
                Number(x.quantity || 0)
          ),
        0
      ),
    [items]
  );

  const discountTotal = Math.max(0, originalTotal - productTotal);
  const deliveryPrice = form.deliveryType === 1 ? 5 : 0;
  const finalTotal = Math.max(
    0,
    productTotal - Number(promo.discountAmount || 0) + deliveryPrice
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const selected = JSON.parse(
        localStorage.getItem("nemesis_checkout_items") || "[]"
      );

      const promoData = JSON.parse(
        localStorage.getItem("nemesis_checkout_promo") || "{}"
      );

      setPromo({
        code: promoData?.code || "",
        discountAmount: Number(promoData?.discountAmount || 0),
      });

      const [basketRes, profileRes] = await Promise.all([
        basketApi.get(),
        profileApi.get().catch(() => null),
      ]);

      const basket = unwrap(basketRes);
      const profile = profileRes ? unwrap(profileRes) : null;

      const list = (basket?.items || []).filter((x) => selected.includes(x.id));

      if (list.length === 0) {
        navigate("/basket");
        return;
      }

      setItems(list);

      setForm((prev) => ({
        ...prev,
        customerFullName: profile?.fullName || "",
        customerPhoneNumber: profile?.phoneNumber || "",
      }));
    } catch (err) {
      setError(err.message || text.checkoutLoadError);
    } finally {
      setLoading(false);
    }
  }

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!form.customerFullName.trim()) return text.fullNameRequired;
    if (!form.customerPhoneNumber.trim()) return text.phoneRequired;
    if (Number(form.deliveryType) === 1 && !form.addressText.trim())
      return text.addressTextRequired;
    if (!form.deliveryDate) return text.deliveryDateRequired;
    return "";
  }

  async function submitOrder() {
    const validation = validate();

    if (validation) {
      setError(validation);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const body = {
        items: items.map((x) => ({ basketItemId: x.id })),
        customerFullName: form.customerFullName.trim(),
        customerPhoneNumber: form.customerPhoneNumber.trim(),
        deliveryType: Number(form.deliveryType),
        paymentMethod: 1,
        addressText: form.addressText.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        buildingNumber: form.buildingNumber.trim(),
        floor: form.floor.trim(),
        apartment: form.apartment.trim(),
        deliveryDate: new Date(form.deliveryDate).toISOString(),
        deliveryTimeRange: form.deliveryTimeRange,
        note: form.note.trim(),
        promoCode: promo.code || "",
      };

      const res = await ordersApi.create(body);
      const data = unwrap(res);

      localStorage.setItem(
        "nemesis_last_order",
        JSON.stringify({
          ...data,
          items,
          totalProductPrice: productTotal,
          deliveryPrice,
          promoDiscountAmount: promo.discountAmount,
          totalPrice: finalTotal,
        })
      );

      window.dispatchEvent(new Event("nemesis_auth_changed"));
      navigate("/order-success", { state: { order: data } });
    } catch (err) {
      localStorage.setItem(
        "nemesis_order_failed",
        JSON.stringify({ reason: err.message || text.orderCreateError })
      );
      navigate("/order-failed", {
        state: { reason: err.message || text.orderCreateError },
      });
    } finally {
      setSaving(false);
    }
  }

  function whatsappOrder() {
    const lines = items
      .map(
        (x, i) =>
          `${i + 1}. ${x.productName}\nKod: ${x.productCode}\nRazmer: ${
            x.sizeValue
          }\nRəng: ${x.colorName}\nSay: ${x.quantity}\nQiymət: ${x.totalPrice} ₼`
      )
      .join("\n\n");

    const message = `Salam, bu məhsulları sifariş etmək istəyirəm:\n\n${lines}\n\nYekun: ${money(finalTotal)} ₼`;
    window.open(
      `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) return <AppLoader text={text.loading} />;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-6 md:px-8 md:py-8">
      {saving && <AppLoader text={text.orderSaving} />}

      <div className="mx-auto max-w-[1180px]">
        <TopBar title={text.checkout} onBack={() => navigate("/basket")} />

        <section className="mt-7 animate-[checkoutUp_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[24px] bg-zinc-950 p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.12)] md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/45">
            NemesisBaku
          </p>
          <h1 className="mt-3 text-[34px] font-medium tracking-[-0.055em] md:text-[52px]">
            {text.checkout}
          </h1>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/55">
            {text.checkoutDesc}
          </p>
        </section>

        {error && (
          <div className="mt-5 rounded-[16px] bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_370px]">
          <section className="space-y-5">
            <Card title={text.selectedProducts}>
              <div className="divide-y divide-zinc-100">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid grid-cols-[82px_1fr_auto] gap-3 py-4"
                  >
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="h-[96px] w-[82px] rounded-[16px] object-cover"
                    />

                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-[15px] font-medium text-zinc-950">
                        {item.productName}
                      </h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                        {item.productCode}
                      </p>
                      <p className="mt-3 text-xs font-medium text-zinc-500">
                        {text.size}: {item.sizeValue} • {item.colorName}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-medium text-zinc-950">
                        {money(item.totalPrice)} ₼
                      </p>
                      <p className="text-xs text-zinc-400">
                        {money(item.unitPrice)} ₼ × {item.quantity}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </Card>

            <Card title={text.customerInfo}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={text.customerFullName}
                  value={form.customerFullName}
                  onChange={(v) => update("customerFullName", v)}
                />
                <Input
                  label={text.customerPhoneNumber}
                  value={form.customerPhoneNumber}
                  onChange={(v) => update("customerPhoneNumber", v)}
                />

                <Select
                  label={text.deliveryType}
                  value={form.deliveryType}
                  onChange={(v) => update("deliveryType", Number(v))}
                  items={[
                    { value: 1, label: text.deliveryToAddress },
                    { value: 2, label: text.pickupFromStore },
                  ]}
                />

                <Select
                  label={text.deliveryTimeRange}
                  value={form.deliveryTimeRange}
                  onChange={(v) => update("deliveryTimeRange", v)}
                  items={[
                    { value: "10:00-12:00", label: "10:00-12:00" },
                    { value: "12:00-15:00", label: "12:00-15:00" },
                    { value: "15:00-18:00", label: "15:00-18:00" },
                    { value: "18:00-21:00", label: "18:00-21:00" },
                  ]}
                />

                <Input
                  label={text.deliveryDate}
                  type="date"
                  value={form.deliveryDate}
                  onChange={(v) => update("deliveryDate", v)}
                />
              </div>
            </Card>

            {Number(form.deliveryType) === 1 && (
              <Card title={text.deliveryAddress}>
                <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-4">
                    <Input
                      label={text.address}
                      value={form.addressText}
                      onChange={(v) => update("addressText", v)}
                      placeholder={text.addressPlaceholder}
                    />

                    <div className="grid gap-3 md:grid-cols-3">
                      <Input
                        label={text.buildingNumber}
                        value={form.buildingNumber}
                        onChange={(v) => update("buildingNumber", v)}
                      />
                      <Input
                        label={text.floor}
                        value={form.floor}
                        onChange={(v) => update("floor", v)}
                      />
                      <Input
                        label={text.apartment}
                        value={form.apartment}
                        onChange={(v) => update("apartment", v)}
                      />
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-800">
                        {text.note}
                      </span>
                      <textarea
                        value={form.note}
                        onChange={(e) => update("note", e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-[15px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-zinc-800">
                      {text.chooseFromMap}
                    </p>

                    <div className="aspect-square overflow-hidden rounded-[18px] border border-zinc-100 bg-zinc-100">
                      <MapContainer
                        center={[form.latitude, form.longitude]}
                        zoom={12}
                        scrollWheelZoom
                        className="h-full w-full"
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapPicker
                          lat={form.latitude}
                          lng={form.longitude}
                          onPick={(lat, lng) => {
                            update("latitude", lat);
                            update("longitude", lng);
                          }}
                        />
                      </MapContainer>
                    </div>

                    <div className="mt-3 rounded-[15px] bg-zinc-50 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                        {text.selectedMapPoint}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-950">
                        {Number(form.latitude).toFixed(6)},{" "}
                        {Number(form.longitude).toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </section>

          <aside className="h-max rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] lg:sticky lg:top-24">
            <h2 className="text-xl font-medium tracking-[-0.03em] text-zinc-950">
              {text.receipt}
            </h2>

            <div className="mt-5 space-y-3">
              <SummaryRow
                label={text.productsTotal}
                value={`${money(originalTotal)} ₼`}
              />
              <SummaryRow
                label={text.discount}
                value={`-${money(discountTotal)} ₼`}
                valueClass="text-red-500"
              />
              <SummaryRow
                label={text.promoDiscount}
                value={`-${money(promo.discountAmount)} ₼`}
                valueClass="text-red-500"
              />
              <SummaryRow
                label={text.delivery}
                value={`${money(deliveryPrice)} ₼`}
              />
            </div>

            <div className="my-5 h-px bg-zinc-100" />

            <div className="flex items-end justify-between">
              <p className="text-sm font-medium text-zinc-500">{text.total}</p>
              <p className="text-[30px] font-medium text-zinc-950">
                {money(finalTotal)} ₼
              </p>
            </div>

            <button
              type="button"
              onClick={submitOrder}
              className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-950 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
            >
              <FiSave />
              {text.completeOrder}
            </button>

            <button
              type="button"
              onClick={whatsappOrder}
              className="mt-3 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-[#1fbd5a] text-sm font-medium text-white transition hover:opacity-95 active:scale-[0.98]"
            >
              <FaWhatsapp className="text-xl" />
              {text.orderWithWhatsapp}
            </button>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes checkoutUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </main>
  );
}

function MapPicker({ lat, lng, onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={[lat, lng]} icon={markerIcon} />;
}

function TopBar({ title, onBack }) {
  return (
    <header className="grid grid-cols-[44px_1fr_44px] items-center">
      <button
        type="button"
        onClick={onBack}
        className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 shadow-sm transition active:scale-95"
      >
        <FiArrowLeft />
      </button>

      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-400">
          NemesisBaku
        </p>
        <h1 className="mt-1 text-lg font-medium tracking-[-0.025em] text-zinc-950">
          {title}
        </h1>
      </div>

      <div />
    </header>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
      <h2 className="mb-4 text-xl font-medium tracking-[-0.03em] text-zinc-950">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-[15px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
      />
    </label>
  );
}

function Select({ label, value, onChange, items }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-[15px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
      >
        {items.map((x) => (
          <option key={x.value} value={x.value}>
            {x.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryRow({ label, value, valueClass = "text-zinc-950" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <p className="font-normal text-zinc-500">{label}</p>
      <p className={`font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}