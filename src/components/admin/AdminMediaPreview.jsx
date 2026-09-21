import { useState } from "react";
import { FiImage } from "react-icons/fi";

export default function AdminMediaPreview({ src, alt = "", className = "", imageClassName = "" }) {
  const [failedSource, setFailedSource] = useState("");
  const available = Boolean(src) && failedSource !== src;

  return (
    <div className={`nb-media ${className}`}>
      {available ? (
        <img
          src={src}
          alt={alt}
          className={imageClassName}
          loading="lazy"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <span className="nb-media__empty" role="img" aria-label={src ? "Şəkil açılmır" : "Şəkil yoxdur"}>
          <FiImage aria-hidden="true" />
          <small>{src ? "Şəkil açılmır" : "Şəkil yoxdur"}</small>
        </span>
      )}
    </div>
  );
}
