import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiEdit3,
  FiMapPin,
  FiPlus,
  FiSave,
  FiStar,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import AppLoader from "../../components/common/AppLoader";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";

const BAKU_CENTER = [40.4093, 49.8671];

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

const emptyForm = {
  id: null,
  title: "",
  addressText: "",
  latitude: BAKU_CENTER[0],
  longitude: BAKU_CENTER[1],
  buildingNumber: "",
  floor: "",
  apartment: "",
  note: "",
  isDefault: false,
};

export default function AddressesPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      setLoading(true);
      setError("");

      const res = await profileApi.addresses();
      const data = unwrap(res);

      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || text.addressesLoadError);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(address) {
    setForm({
      id: address.id,
      title: address.title || "",
      addressText: address.addressText || "",
      latitude: Number(address.latitude || BAKU_CENTER[0]),
      longitude: Number(address.longitude || BAKU_CENTER[1]),
      buildingNumber: address.buildingNumber || "",
      floor: address.floor || "",
      apartment: address.apartment || "",
      note: address.note || "",
      isDefault: Boolean(address.isDefault),
    });

    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveAddress(e) {
    e.preventDefault();

    if (!form.title.trim()) return setError(text.addressTitleRequired);
    if (!form.addressText.trim()) return setError(text.addressTextRequired);

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const body = {
        title: form.title.trim(),
        addressText: form.addressText.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        buildingNumber: form.buildingNumber.trim(),
        floor: form.floor.trim(),
        apartment: form.apartment.trim(),
        note: form.note.trim(),
        isDefault: Boolean(form.isDefault),
      };

      if (form.id) {
        await profileApi.updateAddress(form.id, body);
      } else {
        await profileApi.createAddress(body);
      }

      setMessage(text.addressSaved);
      setModalOpen(false);
      setForm(emptyForm);
      await loadAddresses();
    } catch (err) {
      setError(err.message || text.addressSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(id) {
    const ok = window.confirm(text.confirmAddressDelete);
    if (!ok) return;

    try {
      setSaving(true);
      await profileApi.deleteAddress(id);
      await loadAddresses();
    } catch (err) {
      setError(err.message || text.addressDeleteError);
    } finally {
      setSaving(false);
    }
  }

  async function setDefaultAddress(id) {
    try {
      setSaving(true);
      await profileApi.setDefaultAddress(id);
      await loadAddresses();
    } catch (err) {
      setError(err.message || text.addressDefaultError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
  return (
    <main className="min-h-[calc(100dvh-72px)] bg-[#fafafa]">
      <AppLoader text={text.loading} />
    </main>
  );
}
  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-6 md:px-8 md:py-8">
      {saving && <AppLoader text={text.saving} />}

      <div className="mx-auto max-w-[1080px]">
        <ProfileTopBar
          title={text.myAddresses}
          onBack={() => navigate("/profile")}
        />

        <div className="mt-7 animate-[addressUp_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[22px] bg-zinc-950 p-5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.12)] md:p-7">
          <p className="text-[15px] font-medium tracking-[0.17em] text-white/45">
            nemesisbaku
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-[32px] font-medium tracking-[-0.05em] md:text-[48px]">
                {text.myAddresses}
              </h1>
              <p className="mt-2 max-w-[560px] text-sm leading-6 text-white/55">
                {text.addressesPageDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-white px-5 text-sm font-medium text-zinc-950 transition hover:bg-white/90 active:scale-[0.98]"
            >
              <FiPlus />
              {text.addAddress}
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-[16px] bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-[16px] bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {addresses.length === 0 ? (
          <section className="mt-5 grid min-h-[320px] place-items-center rounded-[20px] bg-white p-5 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-zinc-50 text-3xl text-zinc-400">
                <FiMapPin />
              </div>

              <h2 className="mt-4 text-[24px] font-medium tracking-[-0.035em] text-zinc-950">
                {text.addressesEmptyTitle}
              </h2>

              <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-zinc-500">
                {text.addressesEmptyDesc}
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-5 h-12 rounded-[14px] bg-zinc-950 px-6 text-sm font-medium text-white transition active:scale-[0.98]"
              >
                {text.addAddress}
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-5 grid gap-3">
            {addresses.map((address, index) => (
              <article
                key={address.id}
                className="animate-[addressCard_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[20px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(0,0,0,0.07)] md:p-5"
                style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-medium tracking-[-0.025em] text-zinc-950">
                        {address.title}
                      </h2>

                      {address.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-white">
                          <FiStar />
                          {text.default}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {address.addressText}
                    </p>

                    <p className="mt-2 text-xs font-medium text-zinc-400">
                      {[address.buildingNumber, address.floor, address.apartment]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>

                    <p className="mt-3 text-xs font-medium text-zinc-400">
                      {text.selectedMapPoint}: {Number(address.latitude).toFixed(6)},{" "}
                      {Number(address.longitude).toFixed(6)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDefaultAddress(address.id)}
                        className="grid h-10 w-10 place-items-center rounded-[13px] bg-zinc-50 text-zinc-950 transition hover:bg-zinc-100 active:scale-95"
                      >
                        <FiCheck />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="grid h-10 w-10 place-items-center rounded-[13px] bg-zinc-50 text-zinc-950 transition hover:bg-zinc-100 active:scale-95"
                    >
                      <FiEdit3 />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAddress(address.id)}
                      className="grid h-10 w-10 place-items-center rounded-[13px] bg-red-50 text-red-500 transition hover:bg-red-100 active:scale-95"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {modalOpen && (
        <AddressModal
          form={form}
          text={text}
          saving={saving}
          updateForm={updateForm}
          saveAddress={saveAddress}
          close={() => setModalOpen(false)}
        />
      )}

      <style>{`
        @keyframes addressUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes addressCard {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes modalIn {
          from { opacity: 0; transform: translateY(18px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </main>
  );
}

function AddressModal({ form, text, saving, updateForm, saveAddress, close }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm md:items-center md:p-6">
      <form
        onSubmit={saveAddress}
        className="max-h-[94dvh] w-full max-w-[920px] animate-[modalIn_.32s_cubic-bezier(.22,1,.36,1)_both] overflow-y-auto rounded-[24px] bg-white p-5 shadow-[0_26px_90px_rgba(0,0,0,0.25)] md:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-medium uppercase tracking-[0.17em] text-zinc-400">
              nemesisbaku
            </p>
            <h2 className="mt-1 text-[28px] font-medium tracking-[-0.045em] text-zinc-950">
              {form.id ? text.editAddress : text.addAddress}
            </h2>
          </div>

          <button
            type="button"
            onClick={close}
            className="grid h-11 w-11 place-items-center rounded-full bg-zinc-50 text-xl text-zinc-950 transition active:scale-95"
          >
            <FiX />
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <Input
              label={text.addressTitle}
              value={form.title}
              onChange={(v) => updateForm("title", v)}
              placeholder={text.addressTitlePlaceholder}
            />

            <Input
              label={text.address}
              value={form.addressText}
              onChange={(v) => updateForm("addressText", v)}
              placeholder={text.addressPlaceholder}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <Input
                label={text.buildingNumber}
                value={form.buildingNumber}
                onChange={(v) => updateForm("buildingNumber", v)}
                placeholder="A1"
              />

              <Input
                label={text.floor}
                value={form.floor}
                onChange={(v) => updateForm("floor", v)}
                placeholder="7"
              />

              <Input
                label={text.apartment}
                value={form.apartment}
                onChange={(v) => updateForm("apartment", v)}
                placeholder="82"
              />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-800">
                {text.note}
              </span>

              <textarea
                value={form.note}
                onChange={(e) => updateForm("note", e.target.value)}
                rows={4}
                placeholder={text.addressNotePlaceholder}
                className="w-full resize-none rounded-[15px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
              />
            </label>

            <button
              type="button"
              onClick={() => updateForm("isDefault", !form.isDefault)}
              className={`inline-flex h-11 items-center gap-2 rounded-[14px] px-4 text-sm font-medium transition ${
                form.isDefault
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-50 text-zinc-950"
              }`}
            >
              <FiStar />
              {text.makeDefaultAddress}
            </button>
          </section>

          <section>
            <p className="mb-2 text-sm font-medium text-zinc-800">
              {text.chooseFromMap}
            </p>

            <div className="aspect-square overflow-hidden rounded-[18px] border border-zinc-100 bg-zinc-100">
              <MapContainer
                center={[form.latitude || BAKU_CENTER[0], form.longitude || BAKU_CENTER[1]]}
                zoom={12}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickPicker
                  lat={form.latitude}
                  lng={form.longitude}
                  onPick={(lat, lng) => {
                    updateForm("latitude", lat);
                    updateForm("longitude", lng);
                  }}
                />
              </MapContainer>
            </div>

            <div className="mt-3 rounded-[15px] bg-zinc-50 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                {text.selectedMapPoint}
              </p>

              <p className="mt-1 text-sm font-medium text-zinc-950">
                {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}
              </p>

              <p className="mt-2 text-xs leading-5 text-zinc-400">
                {text.mapPickHint}
              </p>
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={close}
            className="h-12 rounded-[14px] bg-zinc-50 px-6 text-sm font-medium text-zinc-950 transition active:scale-[0.98]"
          >
            {text.cancel}
          </button>

          <button
            disabled={saving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 px-6 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            <FiSave />
            {text.saveAddress}
          </button>
        </div>
      </form>
    </div>
  );
}

function MapClickPicker({ lat, lng, onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={[lat, lng]} icon={markerIcon} />;
}

function ProfileTopBar({ title, onBack }) {
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
        <p className="text-[15px] font-medium tracking-[0.17em] text-zinc-400">
          nemesisbaku
        </p>
        <h1 className="mt-1 text-lg font-medium tracking-[-0.025em] text-zinc-950">
          {title}
        </h1>
      </div>

      <div />
    </header>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-[15px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
      />
    </label>
  );
}