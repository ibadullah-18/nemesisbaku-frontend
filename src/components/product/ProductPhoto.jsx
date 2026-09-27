import { useEffect, useState } from "react";
import { showUserToast } from "../../utils/userToast";

export default function ProductPhoto({
  src, alt, className="", ...props
}) {
  const [display,setDisplay]=useState("");
  const [failed,setFailed]=useState(false);

  useEffect(() => {
    let alive=true;
    const image=new Image();
    image.decoding="async";
    image.src=src;

    image.decode().then(() => {
      if(alive){
        setDisplay(src);
        setFailed(false);
      }
    }).catch(() => {
      if(alive){
        setFailed(true);
        showUserToast(
          "Şəkil yüklənmədi. Başqa şəkli seçin.",
          "error"
        );
      }
    });

    return () => {alive=false;};
  },[src]);

  return <div
    {...props}
    className={"nb-detail-photo "+className}
    aria-busy={!failed && display!==src}
  >
    {display && <img
      key={display}
      src={display}
      alt={alt || ""}
      draggable={false}
      decoding="async"
    />}
    {!display && <span className="nb-detail-photo__status">
      {failed ? "Şəkil əlçatan deyil" : "…"}
    </span>}
  </div>;
}
