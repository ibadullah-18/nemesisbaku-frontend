import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";
import "./homePromoSlider.css";

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
  const stageRef = useRef(null);

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
    [promos],
  );

  const count = validPromos.length;

  const sliderPromos = useMemo(() => {
    if (validPromos.length <= 1) return validPromos;

    return [
      validPromos[validPromos.length - 1],
      ...validPromos,
      validPromos[0],
    ];
  }, [validPromos]);

  function pauseAndResumeLater() {
    setPausedByUser(true);
    clearInterval(autoplayRef.current);
    clearTimeout(resumeRef.current);

    resumeRef.current = window.setTimeout(() => {
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

    resetRef.current = window.setTimeout(() => {
      finishInfiniteMove(nextIndex);
    }, TRANSITION_MS + 80);
  }

  function goNext(userAction = true) {
    if (count <= 1 || movingRef.current) return;
    if (userAction) pauseAndResumeLater();

    movingRef.current = true;
    setWithTransition(true);

    setActiveIndex((previous) => {
      const next = previous + 1;
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

    setActiveIndex((previous) => {
      const next = previous - 1;
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

  function updateStageTilt(event) {
    if (event.pointerType !== "mouse" || !stageRef.current) return;

    const bounds = stageRef.current.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;

    stageRef.current.style.setProperty(
      "--nemesis-hero-rotate-x",
      `${(-normalizedY * 2.8).toFixed(2)}deg`,
    );
    stageRef.current.style.setProperty(
      "--nemesis-hero-rotate-y",
      `${(normalizedX * 3.8).toFixed(2)}deg`,
    );
    stageRef.current.style.setProperty(
      "--nemesis-hero-light-x",
      `${((normalizedX + 0.5) * 100).toFixed(1)}%`,
    );
    stageRef.current.style.setProperty(
      "--nemesis-hero-light-y",
      `${((normalizedY + 0.5) * 100).toFixed(1)}%`,
    );
  }

  function resetStageTilt() {
    if (!stageRef.current) return;

    stageRef.current.style.setProperty("--nemesis-hero-rotate-x", "0deg");
    stageRef.current.style.setProperty("--nemesis-hero-rotate-y", "0deg");
    stageRef.current.style.setProperty("--nemesis-hero-light-x", "50%");
    stageRef.current.style.setProperty("--nemesis-hero-light-y", "36%");
  }

  function handlePointerDown(event) {
    updateStageTilt(event);

    if (event.pointerType === "mouse") {
      pauseAndResumeLater();
      return;
    }

    if (count <= 1 || movingRef.current) return;

    pointerIdRef.current = event.pointerId;
    pointerStartX.current = event.clientX;
    pointerCurrentX.current = event.clientX;
    setDragging(true);
    setDragOffset(0);
    pauseAndResumeLater();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    updateStageTilt(event);

    if (event.pointerType === "mouse") return;
    if (!dragging || pointerIdRef.current !== event.pointerId) return;

    pointerCurrentX.current = event.clientX;
    const difference = pointerCurrentX.current - pointerStartX.current;
    setDragOffset(Math.max(Math.min(difference, 120), -120));
  }

  function handlePointerUp(event) {
    if (event.pointerType === "mouse") return;
    if (!dragging || pointerIdRef.current !== event.pointerId) return;

    const difference = pointerCurrentX.current - pointerStartX.current;
    setDragging(false);
    setDragOffset(0);
    pointerIdRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (Math.abs(difference) < SWIPE_LIMIT) return;
    if (difference < 0) goNext(false);
    else goPrev(false);
  }

  function handlePointerCancel() {
    setDragging(false);
    setDragOffset(0);
    pointerIdRef.current = null;
    resetStageTilt();
  }

  useEffect(() => {
    const resetFrame = window.requestAnimationFrame(() => {
      setActiveIndex(count > 1 ? 1 : 0);
      setRealIndex(0);
    });

    return () => window.cancelAnimationFrame(resetFrame);
  }, [count]);

  useEffect(() => {
    clearInterval(autoplayRef.current);

    if (count <= 1 || pausedByUser) return undefined;

    autoplayRef.current = window.setInterval(() => {
      goNext(false);
    }, AUTO_PLAY_MS);

    return () => clearInterval(autoplayRef.current);
    // `goNext` intentionally uses the current carousel state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, pausedByUser, activeIndex]);

  useEffect(() => {
    return () => {
      clearInterval(autoplayRef.current);
      clearTimeout(resumeRef.current);
      clearTimeout(resetRef.current);
    };
  }, []);

  if (count === 0) return null;

  const translatePercent = count > 1 ? -activeIndex * 100 : 0;

  return (
    <section className="nemesis-home-hero" aria-label="Kampaniyalar">
      <div
        ref={stageRef}
        className="nemesis-home-hero__stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={resetStageTilt}
        onWheel={pauseAndResumeLater}
      >
        <div className="nemesis-home-hero__light" aria-hidden="true" />

        {count > 1 && (
          <div className="nemesis-home-hero__arrows">
            <button
              type="button"
              onClick={() => goPrev(true)}
              aria-label="Əvvəlki kampaniya"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => goNext(true)}
              aria-label="Növbəti kampaniya"
            >
              <FiChevronRight />
            </button>
          </div>
        )}

        <div className="nemesis-home-hero__viewport">
          <div
            onTransitionEnd={() => finishInfiniteMove(activeIndex)}
            className={`nemesis-home-hero__track ${
              dragging || !withTransition
                ? "nemesis-home-hero__track--instant"
                : ""
            }`}
            style={{
              transform: `translate3d(calc(${translatePercent}% + ${dragOffset}px), 0, 0)`,
            }}
          >
            {sliderPromos.map((promo, index) => (
              <PromoCard
                key={`${promo.id}-${index}`}
                promo={promo}
                discoverText={text.discover || "Kəşf et"}
              />
            ))}
          </div>
        </div>

        {count > 1 && (
          <div className="nemesis-home-hero__pagination">
            {validPromos.map((promo, index) => (
              <button
                key={promo.id || index}
                type="button"
                onClick={() => goTo(index)}
                className={index === realIndex ? "is-active" : ""}
                aria-label={`Kampaniya ${index + 1}`}
                aria-current={index === realIndex ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PromoCard({ promo, discoverText }) {
  return (
    <NavLink
      to={getPromoLink(promo)}
      draggable="false"
      className="nemesis-home-hero__slide"
    >
      <picture>
        <source
          media="(max-width: 767px)"
          srcSet={promo.mobileImageUrl || promo.imageUrl}
        />
        <img
          src={promo.imageUrl}
          alt={promo.title || "nemesisbaku kampaniyası"}
          draggable="false"
        />
      </picture>

      <span className="nemesis-home-hero__cta">
        {discoverText}
        <i aria-hidden="true">
          <FiArrowUpRight />
        </i>
      </span>
    </NavLink>
  );
}
