import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { SHOWCASE_SHAPES, showcaseHref } from "../../utils/showcase";
import { cloudinaryResize } from "../../utils/cloudinaryUrl";
import "./showcase.css";

export function ShowcaseImage({ block, eager = false }) {
  return <picture>
    <source media="(max-width: 767px)" srcSet={cloudinaryResize(block.mobileImageUrl || block.imageUrl, 1000)} />
    <img src={cloudinaryResize(block.imageUrl, 1800)} alt={block.imageAlt || ""} loading={eager ? "eager" : "lazy"} decoding="async" />
  </picture>;
}

export default function ShowcaseGroup({ group, preview = false }) {
  const { text } = useLanguage();
  const blocks = (group?.blocks || []).filter(b => b.imageUrl).slice(0, 3);
  if (!blocks.length) return null;
  return <div className="nb-showcase-group" style={{ "--showcase-columns": blocks.length }}>
    {blocks.map((block, index) => {
      const href = showcaseHref(block);
      const props = {
        className: "nb-showcase-tile",
        style: { aspectRatio: (SHOWCASE_SHAPES[block.shape] || SHOWCASE_SHAPES.square).ratio },
      };
      const content = <><ShowcaseImage block={block} />{href && <span className="nb-showcase-discover">{text.discover || "Kəşf et"}</span>}</>;
      if (!href || preview) return <div {...props} key={block.id || block.key || index}>{content}</div>;
      const label = block.imageAlt ? `${text.discover || "Kəşf et"}: ${block.imageAlt}` : text.discover || "Kəşf et";
      return block.targetType === "internal"
        ? <Link {...props} key={block.id} to={href} aria-label={label}>{content}</Link>
        : <a {...props} key={block.id} href={href} aria-label={label}>{content}</a>;
    })}
  </div>;
}
