import { FiArrowUpRight } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./storefront.css";

export default function StoreCarousel({ items, hero = false, discover, onIntent }) {
  const root = useRef(null), rail = useRef(null), gesture = useRef(null);
  const frame = useRef(0), activeRef = useRef(0);
  const settleTimer = useRef(0), touching = useRef(false);
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
      clearTimeout(settleTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = rail.current;
    let width = el.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const nextWidth = el.getBoundingClientRect().width;
      // Height-only layout changes must not interrupt a native swipe.
      if (Math.abs(nextWidth - width) < 0.01) return;
      width = nextWidth;
      if (!touching.current) {
        const slide = el.children[activeRef.current];
        if (slide) el.scrollTo({ left: slide.offsetLeft, behavior: "instant" });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function scheduleSettle() {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = rail.current;
      if (!el || touching.current || !el.children.length) return;
      const slides = Array.from(el.children);
      const nearest = slides.reduce((best, slide) =>
        Math.abs(slide.offsetLeft - el.scrollLeft) < Math.abs(best.offsetLeft - el.scrollLeft)
          ? slide : best
      );
      // Safari can leave native snapping between slides after an interrupted swipe.
      if (Math.abs(el.scrollLeft - nearest.offsetLeft) > 1) {
        el.scrollTo({ left: nearest.offsetLeft, behavior: "instant" });
      }
    }, 180);
  }

  function go(index) {
    if (!items.length || !rail.current) return;
    const next = (index + items.length) % items.length;
    setVisited(old => new Set([...old, next]));
    rail.current.scrollTo({
      left: rail.current.children[next].offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant" : "smooth"
    });
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

  function scroll() {
    scheduleSettle();
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = rail.current;
      if (!el?.clientWidth) return;
      const next = Math.max(0, Math.min(
        items.length - 1, Math.round(el.scrollLeft / el.getBoundingClientRect().width)
      ));
      activeRef.current = next;
      setActive(next);
      setVisited(old => old.has(next) ? old : new Set([...old, next]));
    });
  }

  return <div ref={root} data-nemesis-no-rubber="true"
    className={hero ? "nb-carousel nb-carousel--hero" : "nb-carousel"}
    onMouseEnter={() => { if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) { setPaused(true); onIntent?.(); } }}
    onMouseLeave={() => setPaused(false)}
    onFocusCapture={() => { setPaused(true); onIntent?.(); }}
    onBlurCapture={e => {
      if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
    }}>
    <div ref={rail} className="nb-carousel__rail" onScroll={scroll}
      onTouchStart={() => {
        touching.current = true;
        clearTimeout(settleTimer.current);
      }}
      onTouchEnd={() => { touching.current = false; scheduleSettle(); }}
      onTouchCancel={() => { touching.current = false; scheduleSettle(); }}
      onPointerDown={e => {
        gesture.current = { x: e.clientX, y: e.clientY, moved: false };
        setPaused(true);
        onIntent?.();
      }}
      onPointerMove={e => {
        const g = gesture.current;
        if (g && Math.hypot(e.clientX-g.x, e.clientY-g.y)>8) g.moved=true;
      }}
      onPointerUp={() => setPaused(false)}
      onPointerCancel={() => {
        if (gesture.current) gesture.current.moved=true;
        setPaused(false);
      }}
      onClickCapture={e => {
        if (gesture.current?.moved) {
          e.preventDefault();
          e.stopPropagation();
          gesture.current = null;
        }
      }}>
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
        {items.map((item, index) => Math.abs(index-active) < 3 &&
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
