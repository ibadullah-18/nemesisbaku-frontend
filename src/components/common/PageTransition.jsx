
import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./pageTransition.css";

export default function PageTransition({ children }) {
  const element = useRef(null);
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const node = element.current;
    const preference = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (!node?.animate || preference.matches) return;

    const animation = node.animate(
      [{ opacity: 0.35 }, { opacity: 1 }],
      {
        duration: 180,
        easing: "cubic-bezier(.2,.7,.2,1)"
      }
    );

    const stop = () => animation.cancel();
    preference.addEventListener("change", stop);

    return () => {
      animation.cancel();
      preference.removeEventListener("change", stop);
    };
  }, [pathname]);

  return (
    <div ref={element} className="nb-page-transition">
      {children}
    </div>
  );
}
