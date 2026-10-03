import SiteSelect from "../common/SiteSelect";
import { useEffect, useState } from "react";
import { FiFilter } from "react-icons/fi";
import { preloadProductDiscoveryData } from "../product/ProductDiscoveryBar";

const labels = {
  az: {
    all:"Hamısı", sort:"Sıralama", normal:"Standart",
    cheap:"Ən ucuz", expensive:"Ən baha",
    stock:"Stokda olanlar", filter:"Filter", title:"Məhsul seçimləri"
  },
  ru: {
    all:"Все", sort:"Сортировка", normal:"По умолчанию",
    cheap:"Сначала дешевле", expensive:"Сначала дороже",
    stock:"В наличии", filter:"Фильтр", title:"Выбор товаров"
  },
  en: {
    all:"All", sort:"Sort by", normal:"Default",
    cheap:"Lowest price", expensive:"Highest price",
    stock:"In stock", filter:"Filter", title:"Product options"
  }
};

function change(detail) {
  window.dispatchEvent(
    new CustomEvent("nemesis_quick_discovery", { detail })
  );
}

export default function HomeQuickDiscovery({
  lang="az",
  activeFilters={}
}) {
  const t = labels[lang] || labels.az;
  const [categories,setCategories] = useState([]);

  useEffect(() => {
    let alive=true;
    preloadProductDiscoveryData().then(options => {
      if (alive) setCategories(options?.categories || []);
    }).catch(() => {});
    return () => { alive=false; };
  }, []);

  return <section className="nb-catalog-tools" aria-label={t.title}>
    <div className="nb-catalog-tools__categories">
      {[{id:"",name:t.all}, ...categories].map(category =>
        <button
          type="button"
          key={category.id}
          className="nb-category-choice"
          aria-pressed={
            String(activeFilters.categoryId || "") === String(category.id)
          }
          onClick={() => change({categoryId:category.id})}
        >
          {category.name}
        </button>
      )}
    </div>

    <div className="nb-catalog-tools__actions">
      <label className="nb-stock-choice">
        <input
          type="checkbox"
          checked={activeFilters.stockOnly === true}
          onChange={e => change({stockOnly:e.target.checked})}
        />
        <span>{t.stock}</span>
      </label>

      <div className="nb-sort-choice">
        <SiteSelect
          aria-label={t.sort}
          value={activeFilters.sortOrder || ""}
          onChange={e => change({sortOrder:e.target.value})}
        >
          <option value="">{t.sort}: {t.normal}</option>
          <option value="price-asc">{t.cheap}</option>
          <option value="price-desc">{t.expensive}</option>
        </SiteSelect>

      </div>

      <button
        type="button"
        className="nb-catalog-filter"
        aria-haspopup="dialog"
        onClick={() => window.dispatchEvent(
          new CustomEvent("nemesis_open_filter")
        )}
      >
        <FiFilter aria-hidden="true" />
        <span>{t.filter}</span>
      </button>
    </div>
  </section>;
}
