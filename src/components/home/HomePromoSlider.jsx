import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";

const AUTO_PLAY_MS = 5000;
const RESUME_AFTER_USER_MS = 5000;
const TRANSITION_MS = 650;
const SWIPE_LIMIT = 45;

function getPromoLink(promo) {
  if (!promo?.id) return "/";
  return `/promo/${promo.id}`;
}

function mod(index, length) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

export default function HomePromoSlider({ promos = [] }) {
  const { text } = useLanguage();

  const autoplayRef = useRef(null);
  const resumeRef = useRef(null);
  const resetRef = useRef(null);
  const movingRef = useRef(false);

  const pointerStartX = useRef(0);
  const pointerCurrentX = useRef(0);
  const pointerIdRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [realIndex, setRealIndex] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const validPromos = useMemo(
    () => promos.filter((promo) => promo?.imageUrl),
    [promos]
  );

  const count = validPromos.length;

  const sliderPromos = useMemo(() => {
    if (validPromos.length <= 1) return validPromos;
    return [validPromos[validPromos.length - 1], ...validPromos, validPromos[0]];
  }, [validPromos]);

  useEffect(() => {
    if (count > 1) {
      setActiveIndex(1);
      setRealIndex(0);
    } else {
      setActiveIndex(0);
      setRealIndex(0);
    }
  }, [count]);

  useEffect(() => {
    clearInterval(autoplayRef.current);

    if (count <= 1 || pausedByUser) return;

    autoplayRef.current = setInterval(() => {
      goNext(false);
    }, AUTO_PLAY_MS);

    return () => clearInterval(autoplayRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, pausedByUser, activeIndex]);

  useEffect(() => {
    return () => {
      clearInterval(autoplayRef.current);
      clearTimeout(resumeRef.current);
      clearTimeout(resetRef.current);
    };
  }, []);

  function pauseAndResumeLater() {
    setPausedByUser(true);

    clearInterval(autoplayRef.current);
    clearTimeout(resumeRef.current);

    resumeRef.current = setTimeout(() => {
      setPausedByUser(false);
    }, RESUME_AFTER_USER_MS);
  }

  function finishInfiniteMove(currentIndex) {
    clearTimeout(resetRef.current);

    if (currentIndex === count + 1) {
      setWithTransition(false);
      setActiveIndex(1);
      setRealIndex(0);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
          movingRef.current = false;
        });
      });

      return;
    }

    if (currentIndex === 0) {
      setWithTransition(false);
      setActiveIndex(count);
      setRealIndex(count - 1);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
          movingRef.current = false;
        });
      });

      return;
    }

    movingRef.current = false;
  }

  function scheduleFallbackNormalize(nextIndex) {
    clearTimeout(resetRef.current);

    resetRef.current = setTimeout(() => {
      finishInfiniteMove(nextIndex);
    }, TRANSITION_MS + 80);
  }

  function goNext(userAction = true) {
    if (count <= 1 || movingRef.current) return;

    if (userAction) pauseAndResumeLater();

    movingRef.current = true;
    setWithTransition(true);

    setActiveIndex((prev) => {
      const next = prev + 1;
      setRealIndex(mod(next - 1, count));
      scheduleFallbackNormalize(next);
      return next;
    });
  }

  function goPrev(userAction = true) {
    if (count <= 1 || movingRef.current) return;

    if (userAction) pauseAndResumeLater();

    movingRef.current = true;
    setWithTransition(true);

    setActiveIndex((prev) => {
      const next = prev - 1;
      setRealIndex(mod(next - 1, count));
      scheduleFallbackNormalize(next);
      return next;
    });
  }

  function goTo(index) {
    if (count <= 1 || index === realIndex || movingRef.current) return;

    pauseAndResumeLater();

    movingRef.current = true;
    setWithTransition(true);
    setRealIndex(index);
    setActiveIndex(index + 1);
    scheduleFallbackNormalize(index + 1);
  }

function handlePointerDown(e) {
  if (e.pointerType === "mouse") {
    pauseAndResumeLater();
    return;
  }

  if (count <= 1 || movingRef.current) return;

  pointerIdRef.current = e.pointerId;
  pointerStartX.current = e.clientX;
  pointerCurrentX.current = e.clientX;

  setDragging(true);
  setDragOffset(0);
  pauseAndResumeLater();

  e.currentTarget.setPointerCapture?.(e.pointerId);
}

function handlePointerMove(e) {
  if (e.pointerType === "mouse") return;
  if (!dragging || pointerIdRef.current !== e.pointerId) return;

  pointerCurrentX.current = e.clientX;

  const diff = pointerCurrentX.current - pointerStartX.current;
  const limited = Math.max(Math.min(diff, 120), -120);

  setDragOffset(limited);
}
function handlePointerUp(e) {
  if (e.pointerType === "mouse") return;
  if (!dragging || pointerIdRef.current !== e.pointerId) return;

  const diff = pointerCurrentX.current - pointerStartX.current;

  setDragging(false);
  setDragOffset(0);
  pointerIdRef.current = null;

  e.currentTarget.releasePointerCapture?.(e.pointerId);

  if (Math.abs(diff) < SWIPE_LIMIT) return;

  if (diff < 0) {
    goNext(false);
  } else {
    goPrev(false);
  }
}

  function handlePointerCancel() {
    setDragging(false);
    setDragOffset(0);
    pointerIdRef.current = null;
  }

  function handleTransitionEnd() {
    finishInfiniteMove(activeIndex);
  }

  if (count === 0) return null;

  const translatePercent = count > 1 ? -activeIndex * 100 : 0;

  return (
    <section className="nemesis-promo-fullbleed relative overflow-hidden py-0">
      <style>{`
        .nemesis-promo-fullbleed {
          width: 100vw !important;
          max-width: none !important;
          margin-left: calc(50% - 50vw) !important;
          margin-right: calc(50% - 50vw) !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        @supports (width: 100dvw) {
          .nemesis-promo-fullbleed {
            width: 100dvw !important;
            margin-left: calc(50% - 50dvw) !important;
            margin-right: calc(50% - 50dvw) !important;
          }
        }

        .nemesis-promo-card {
          width: 100% !important;
          aspect-ratio: 2 / 3 !important;
          border-radius: 0 !important;
        }

        @media (min-width: 768px) {
          .nemesis-promo-card {
            aspect-ratio: 2 / 1 !important;
          }
        }
      `}</style>

      <div className="relative">
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goPrev(true)}
              className="absolute left-4 top-1/2 z-40 hidden h-[150px] w-9 -translate-y-1/2 place-items-center text-3xl font-light text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition hover:-translate-x-1 lg:grid"
              aria-label="Əvvəlki kampaniya"
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              onClick={() => goNext(true)}
              className="absolute right-4 top-1/2 z-40 hidden h-[150px] w-9 -translate-y-1/2 place-items-center text-3xl font-light text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition hover:translate-x-1 lg:grid"
              aria-label="Növbəti kampaniya"
            >
              <FiChevronRight />
            </button>
          </>
        )}

        <div
          className="touch-pan-y select-none overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onWheel={pauseAndResumeLater}
        >
          <div className="overflow-hidden">
            <div
              onTransitionEnd={handleTransitionEnd}
              className={`flex ${
                dragging || !withTransition
                  ? "transition-none"
                  : "transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              }`}
              style={{
                transform: `translate3d(calc(${translatePercent}% + ${dragOffset}px), 0, 0)`,
              }}
            >
              {sliderPromos.map((promo, index) => (
                <div key={`${promo.id}-${index}`} className="min-w-full px-0">
                  <PromoCard promo={promo} text={text} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {count > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {validPromos.map((promo, index) => (
              <button
                key={promo.id || index}
                type="button"
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === realIndex
                    ? "w-8 bg-zinc-950"
                    : "w-2 bg-zinc-300 hover:bg-zinc-400"
                }`}
                aria-label={`Kampaniya ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PromoCard({ promo, text }) {
  return (
    <NavLink
      to={getPromoLink(promo)}
      draggable="false"
      className="nemesis-promo-card group relative block w-full overflow-hidden bg-[#efe7da]"
    >
      <picture className="absolute inset-0 block h-full w-full">
        <source
          media="(max-width: 767px)"
          srcSet={promo.mobileImageUrl || promo.imageUrl}
        />
        <img
          src={promo.imageUrl}
          alt="Kampaniya şəkli"
          draggable="false"
          className="h-full w-full object-cover"
        />
      </picture>

      <span className="absolute bottom-3 left-3 z-10 inline-flex h-8 items-center gap-2 rounded-full border border-white/60 bg-black/20 py-1 pl-3.5 pr-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-md transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-black/30 md:bottom-5 md:left-5 md:h-10 md:pl-4 md:pr-2 md:text-[10px]">
        {text.discover || "Kəşf et"}

        <span className="grid h-5 w-5 place-items-center rounded-full bg-white/90 text-[12px] text-zinc-950 md:h-7 md:w-7 md:text-sm">
          <FiChevronRight />
        </span>
      </span>
    </NavLink>
  );
}
