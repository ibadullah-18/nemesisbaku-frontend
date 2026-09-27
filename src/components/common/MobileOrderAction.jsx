import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiArrowRight } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";
import "./mobileOrderAction.css";

const money = value =>
  Number(value || 0).toLocaleString("az-AZ", {
    maximumFractionDigits: 2
  });

export default function MobileOrderAction({
  total,
  original,
  label,
  onClick,
  disabled,
  className
}) {
  const target = useRef(null);
  const panel = useRef(null);
  const [visible, setVisible] = useState(false);
  const { text } = useLanguage();

  const discount = Math.max(
    0,
    Number(original || 0) - Number(total || 0)
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    let observer;

    const update = () => {
      const rect = target.current?.getBoundingClientRect();

      setVisible(Boolean(
        query.matches &&
        rect &&
        (rect.bottom <= 0 || rect.top >= window.innerHeight)
      ));
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(update, {
        threshold: [0, 1]
      });

      if (target.current) observer.observe(target.current);
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    query.addEventListener("change", update);
    update();

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      query.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!visible || !panel.current) return;

    const root = document.documentElement;

    const update = () => {
      root.style.setProperty(
        "--nb-order-dock-height",
        panel.current.getBoundingClientRect().height + "px"
      );
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(panel.current);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--nb-order-dock-height");
    };
  }, [visible]);

  return (
    <>
      <button
        ref={target}
        type="button"
        className={className}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
        <FiArrowRight aria-hidden="true" />
      </button>

      {createPortal(
        <div
          ref={panel}
          className="nb-mobile-order-dock"
          data-open={visible}
          aria-hidden={!visible}
          inert={!visible}
        >
          <div className="nb-mobile-order-dock__price">
            <span>{text.total}</span>

            <div>
              <strong>{money(total)} ₼</strong>
              {discount > 0 && <del>{money(original)} ₼</del>}
            </div>

            {discount > 0 && (
              <small>
                {text.discount}: −{money(discount)} ₼
              </small>
            )}
          </div>

          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
          >
            {label}
            <FiArrowRight aria-hidden="true" />
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
