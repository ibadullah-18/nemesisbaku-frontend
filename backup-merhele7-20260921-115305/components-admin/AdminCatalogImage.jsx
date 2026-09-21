import { useState } from "react";
import { FiImage } from "react-icons/fi";

export default function AdminCatalogImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  return <div className={`nb-catalog__image ${className}`}>
    {src && !failed
      ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      : <span className="nb-catalog__image-empty">
        <FiImage aria-hidden="true" /> {src ? "Şəkil açılmır" : "Şəkil yoxdur"}
      </span>}
  </div>;
}
