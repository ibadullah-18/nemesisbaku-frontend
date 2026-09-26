import { useMemo } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import StoreCarousel from "../common/StoreCarousel";

export default function HomePromoSlider({ promos = [] }) {
  const { text } = useLanguage();
  const items = useMemo(() => promos.filter(p => p?.imageUrl).map(p => ({
    key: p.id,
    src: p.imageUrl,
    mobileSrc: p.mobileImageUrl,
    alt: p.title || "Kampaniya",
    to: p.id ? "/promo/" + p.id : "/"
  })), [promos]);

  if (!items.length) return null;
  return <section className="nb-home-hero" aria-label="Kampaniyalar">
    <StoreCarousel key={items.map(p => p.key + p.src).join("|")}
      items={items} hero discover={text.discover || "Kəşf et"} />
  </section>;
}
