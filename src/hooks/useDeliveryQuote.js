import { useEffect, useMemo, useState } from "react";
import { ordersApi } from "../api/ordersApi";
import { deliveryQuoteKey } from "../utils/delivery";

export default function useDeliveryQuote({ deliveryType, latitude, longitude, metroStationId }) {
  const key = deliveryQuoteKey({ deliveryType, latitude, longitude, metroStationId });
  const [state, setState] = useState({ key: null, available: false });
  const [revision, setRevision] = useState(0);
  const request = useMemo(() => ({ key, revision }), [key, revision]);
  const type = Number(deliveryType);
  useEffect(() => {
    if (type === 2 || (type === 3 && !metroStationId)) return;
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await ordersApi.calculateDelivery({
          deliveryType: type,
          ...(type === 1 ? { latitude: Number(latitude), longitude: Number(longitude) } : { metroStationId }),
        }, { signal: controller.signal });
        const data = res?.data?.data ?? res?.data ?? res;
        if (!Number.isFinite(Number(data?.deliveryPrice)) || data?.deliveryPrice == null || Number(data.deliveryPrice) < 0) throw new Error("Çatdırılma qiyməti alınmadı.");
        if (alive) setState({ ...data, key, request, available: true, message: "" });
      } catch (err) {
        if (alive) setState({ key, request, available: false, message: err.message });
      }
    }, 200);
    return () => { alive = false; clearTimeout(timer); controller.abort(); };
  }, [key, type, latitude, longitude, metroStationId, request]);
  const retry = () => { setState({ key: null, available: false }); setRevision(v => v + 1); };
  if (type === 2) return { key, available: true, pending: false, deliveryPrice: 0, pricingRule: "store-pickup", retry };
  if (type === 3 && !metroStationId) return { key, available: false, pending: false, deliveryPrice: 0, retry };
  if (state.request !== request) return { key, pending: true, available: false, deliveryPrice: 0, retry };
  return { ...state, pending: false, retry };
}
