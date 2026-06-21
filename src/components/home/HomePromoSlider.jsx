import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";

const AUTO_PLAY_MS = 8000;
const RESUME_AFTER_USER_MS = 5000;
const TRANSITION_MS = 650;
const SWIPE_LIMIT = 45;

function getPromoLink(promo) {
  if (!promo?.slug) return "/";
  return `/${promo.slug}`;
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

  const [activeIndex, setActiveIndex] = useState(1);
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

  const translatePercent = -activeIndex * 100;

  return (
    <section className="mx-auto max-w-[1180px] overflow-hidden px-5 py-5 md:px-8 md:py-8">
      <div className="relative">
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goPrev(true)}
              className="absolute -left-10 top-1/2 z-40 hidden h-[150px] w-9 -translate-y-1/2 place-items-center text-3xl font-light text-zinc-900 transition hover:-translate-x-1 lg:grid"
              aria-label="Əvvəlki kampaniya"
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              onClick={() => goNext(true)}
              className="absolute -right-10 top-1/2 z-40 hidden h-[150px] w-9 -translate-y-1/2 place-items-center text-3xl font-light text-zinc-900 transition hover:translate-x-1 lg:grid"
              aria-label="Növbəti kampaniya"
            >
              <FiChevronRight />
            </button>
          </>
        )}

        <div
          className="overflow-hidden rounded-[32px] touch-pan-y select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onWheel={pauseAndResumeLater}
        >
          <div className="overflow-hidden rounded-[32px]">
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
      className="group relative block h-[360px] overflow-hidden rounded-[28px] bg-[#efe7da] shadow-[0_24px_70px_rgba(0,0,0,0.14)] md:h-[430px] md:rounded-[32px] lg:h-[460px]"
    >
      <img
        src={promo.imageUrl}
        alt={promo.title}
        draggable="false"
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-[#efe7da]/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#efe7da]/95 via-[#efe7da]/58 to-black/12" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

      <div className="absolute left-0 top-0 z-10 flex h-full w-full items-center p-6 md:p-10">
        <div className="max-w-[300px] text-left md:max-w-[430px]">
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.32em] text-zinc-700 md:text-xs">
            NemesisBaku
          </p>

          <h1 className="text-[42px] font-extrabold leading-[0.92] tracking-[-0.065em] text-zinc-950 md:text-[72px]">
            {promo.title}
          </h1>

          {promo.description && (
            <p className="mt-4 max-w-[360px] text-xs font-semibold leading-5 text-zinc-700 md:text-sm md:leading-6">
              {promo.description}
            </p>
          )}

          <div className="mt-6 inline-flex h-11 items-center gap-4 rounded-[10px] bg-zinc-950 px-6 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition group-hover:gap-6 active:scale-[0.97] md:h-14 md:rounded-[14px] md:px-8 md:text-sm">
            {text.discover || "Kəşf et"}
            <FiChevronRight className="text-lg md:text-xl" />
          </div>
        </div>
      </div>
    </NavLink>
  );
}