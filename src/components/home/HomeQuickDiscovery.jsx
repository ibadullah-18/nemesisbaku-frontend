import { useEffect, useState } from "react";
import {
  FiArrowDown,
  FiArrowUp,
  FiBox,
  FiChevronRight,
} from "react-icons/fi";
import { preloadProductDiscoveryData } from "../product/ProductDiscoveryBar";

const copy = {
  az: {
    eyebrow: "Sürətli seçim",
    title: "Axtardığını daha tez tap",
    cheap: "Ən ucuz",
    cheapNote: "Qiymət artan sıra ilə",
    expensive: "Ən baha",
    expensiveNote: "Qiymət azalan sıra ilə",
    stock: "Stokda olanlar",
    stockNote: "Hazır məhsulları göstər",
    types: "Ayaqqabı növləri",
  },
  ru: {
    eyebrow: "Быстрый выбор",
    title: "Найдите нужное быстрее",
    cheap: "Сначала дешевле",
    cheapNote: "По возрастанию цены",
    expensive: "Сначала дороже",
    expensiveNote: "По убыванию цены",
    stock: "В наличии",
    stockNote: "Показать доступные товары",
    types: "Типы обуви",
  },
  en: {
    eyebrow: "Quick discovery",
    title: "Find the right pair faster",
    cheap: "Lowest price",
    cheapNote: "Price low to high",
    expensive: "Highest price",
    expensiveNote: "Price high to low",
    stock: "In stock",
    stockNote: "Show available products",
    types: "Shoe types",
  },
};

function sendPreset(detail) {
  window.dispatchEvent(
    new CustomEvent("nemesis_quick_discovery", { detail }),
  );
}

export default function HomeQuickDiscovery({
  lang = "az",
  activeFilters = {},
}) {
  const text = copy[lang] || copy.az;
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;

    preloadProductDiscoveryData()
      .then((options) => {
        if (active) setCategories((options?.categories || []).slice(0, 8));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const actions = [
    {
      icon: <FiArrowDown />,
      title: text.cheap,
      note: text.cheapNote,
      preset: { sortOrder: "price-asc" },
    },
    {
      icon: <FiArrowUp />,
      title: text.expensive,
      note: text.expensiveNote,
      preset: { sortOrder: "price-desc" },
    },
    {
      icon: <FiBox />,
      title: text.stock,
      note: text.stockNote,
      preset: { stockOnly: true },
    },
  ];

  return (
    <section className="nemesis-home-quick" aria-labelledby="quick-discovery-title">
      <div className="nemesis-home-quick__heading">
        <p>{text.eyebrow}</p>
        <h2 id="quick-discovery-title">{text.title}</h2>
      </div>

      <div className="nemesis-home-quick__actions">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => sendPreset(action.preset)}
            aria-pressed={
              (action.preset.sortOrder &&
                activeFilters.sortOrder === action.preset.sortOrder) ||
              (action.preset.stockOnly && activeFilters.stockOnly === true)
            }
            className={`nemesis-home-quick__action ${
              (action.preset.sortOrder &&
                activeFilters.sortOrder === action.preset.sortOrder) ||
              (action.preset.stockOnly && activeFilters.stockOnly === true)
                ? "is-active"
                : ""
            }`}
          >
            <i aria-hidden="true">{action.icon}</i>
            <span>
              <strong>{action.title}</strong>
              <small>{action.note}</small>
            </span>
            <FiChevronRight aria-hidden="true" />
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="nemesis-home-quick__types">
          <span>{text.types}</span>
          <div>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => sendPreset({ categoryId: category.id })}
                aria-pressed={
                  String(activeFilters.categoryId || "") === String(category.id)
                }
                className={
                  String(activeFilters.categoryId || "") === String(category.id)
                    ? "is-active"
                    : ""
                }
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
