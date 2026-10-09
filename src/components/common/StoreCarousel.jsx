import { FiArrowUpRight } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./storefront.css";

export default function StoreCarousel({ items, hero = false, discover, onIntent }) {
  const root = useRef(null), rail = useRef(null), gesture = useRef(null);
  const frame = useRef(0), activeRef = useRef(0);

  const [active, setActive] = useState(0), [near, setNear] = useState(hero);
  const [paused, setPaused] = useState(false);
  const [visited, setVisited] = useState(() => new Set([0]));

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "160px" });
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);

    };
  }, []);

  function paint(index, offset = 0, animate = true) {
    const el = rail.current;
    if (!el) return;
    el.style.transition = animate ? "" : "none";
    el.style.transform = `translate3d(calc(${-index * 100}% + ${offset}px), 0, 0)`;
  }

  function go(index) {
    if (!items.length) return;
    cancelAnimationFrame(frame.current);
    const next = (index + items.length) % items.length;
    activeRef.current = next;
    setActive(next);
    setVisited(old => old.has(next) ? old : new Set([...old, next]));
    paint(next);
  }

  function finish(e, cancelled = false) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    cancelAnimationFrame(frame.current);
    if (g.axis === "x") {
      const threshold = Math.min(48, g.width * 0.2);
      const step = !cancelled && Math.abs(g.dx) >= threshold ? (g.dx < 0 ? 1 : -1) : 0;
      go(Math.max(0, Math.min(items.length - 1, activeRef.current + step)));
    } else {
      paint(activeRef.current);
    }
    g.ended = true;
    setPaused(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  useEffect(() => {
    if (!hero || paused || items.length < 2 || window.matchMedia("(hover: none), (pointer: coarse)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      const bounds = root.current?.getBoundingClientRect();
      if (!document.hidden && bounds?.bottom > 0 && bounds?.top < innerHeight) {
        void go(activeRef.current + 1);
      }
    }, 5000);
    return () => clearInterval(timer);
    // The timer reads the latest position from activeRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero, paused, items]);

  return <div ref={root} data-nemesis-no-rubber="true"
    className={hero ? "nb-carousel nb-carousel--hero" : "nb-carousel"}
    onMouseEnter={() => { if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) { setPaused(true); onIntent?.(); } }}
    onMouseLeave={() => setPaused(false)}
    onFocusCapture={() => { setPaused(true); onIntent?.(); }}
    onBlurCapture={e => {
      if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
    }}>
    <div className="nb-carousel__viewport"
      onPointerDown={e => {
        if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
        gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY,
          width: e.currentTarget.clientWidth, dx: 0, axis: null, moved: false, ended: false };
        setPaused(true);
        onIntent?.();
      }}
      onPointerMove={e => {
        const g = gesture.current;
        if (!g || g.ended || g.id !== e.pointerId) return;
        const dx = e.clientX - g.x, dy = e.clientY - g.y;
        if (!g.axis && Math.hypot(dx, dy) > 8) {
          g.moved = true;
          g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          if (g.axis === "x") e.currentTarget.setPointerCapture(e.pointerId);
        }
        if (g.axis !== "x") return;
        g.dx = dx;
        const edge = (activeRef.current === 0 && dx > 0) ||
          (activeRef.current === items.length - 1 && dx < 0);
        const offset = Math.max(-g.width, Math.min(g.width, edge ? dx * 0.2 : dx));
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => paint(activeRef.current, offset, false));
      }}
      onPointerUp={e => finish(e)}
      onPointerCancel={e => finish(e, true)}
      onLostPointerCapture={e => {
        if (!gesture.current?.ended) finish(e, true);
      }}
      onClickCapture={e => {
        if (gesture.current?.moved) {
          e.preventDefault();
          e.stopPropagation();
          gesture.current = null;
        }
      }}>
    <div ref={rail} className="nb-carousel__rail">
      {items.map((item, index) => {
        const content = <>
          <GalleryImage item={item}
            enabled={(visited.has(index) ||
              (near && Math.abs(index-active) <= 1 && !navigator.connection?.saveData))
              && (near || index === 0)}
            priority={hero && index === 0} />
          {hero && <span className="nb-hero-cta">
            {discover}<FiArrowUpRight aria-hidden="true" size={19} />
          </span>}
        </>;
        return item.to
          ? <NavLink className="nb-carousel__slide"
              key={item.key || item.src} to={item.to} state={item.state} onClick={item.onClick} draggable={false}
              tabIndex={index === active ? 0 : -1}
              aria-hidden={index !== active}>{content}</NavLink>
          : <div className="nb-carousel__slide"
              key={item.key || item.src}
              aria-hidden={index !== active}>{content}</div>;
      })}
    </div>
    </div>
    {items.length > 1 && <>
      {[-1, 1].map(direction => <button key={direction} type="button"
        className={"nb-carousel__arrow nb-carousel__arrow--" +
          (direction < 0 ? "prev" : "next")}
        aria-label={direction < 0 ? "Əvvəlki şəkil" : "Növbəti şəkil"}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          void go(activeRef.current + direction);
        }}>
        {direction < 0 ? <FiChevronLeft /> : <FiChevronRight />}
      </button>)}
      <div className="nb-carousel__dots">
        {items.map((item, index) => index >= Math.max(0, Math.min(active - 1, items.length - 3)) &&
          index < Math.max(0, Math.min(active - 1, items.length - 3)) + 3 &&
          <button type="button" key={item.key || item.src}
            aria-label={(index+1)+"-ci şəkil"}
            aria-current={index === active ? "true" : undefined}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              void go(index);
            }} />)}
      </div>
    </>}
  </div>;
}

function GalleryImage({ item, enabled, priority }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div className="nb-image" data-ready={ready}>
    {enabled && !failed && <picture>
      {item.mobileSrc &&
        <source media="(max-width: 767px)" srcSet={item.mobileSrc} />}
      <img src={item.src} alt={item.alt || ""}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async" draggable={false}
        onLoad={() => setReady(true)}
        onError={() => setFailed(true)} />
    </picture>}
    {failed && <span className="nb-image__error">Şəkil əlçatan deyil</span>}
  </div>;
}
