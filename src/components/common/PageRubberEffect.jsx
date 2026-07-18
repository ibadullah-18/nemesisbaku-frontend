import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const RELEASE_DURATION = 520;

function isVisible(element) {
  if (!element?.isConnected) return false;

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function findPageSurface() {
  const explicit = document.querySelector('[data-nemesis-page-surface="true"]');

  if (isVisible(explicit)) return explicit;

  const main = [...document.querySelectorAll("main")].find(
    (element) =>
      isVisible(element) &&
      !element.closest('[role="dialog"]') &&
      !element.hasAttribute("data-nemesis-no-rubber"),
  );

  if (main) return main;

  return [...document.querySelectorAll("#root section")].find(
    (element) =>
      isVisible(element) &&
      !element.parentElement?.closest("main, section") &&
      !element.hasAttribute("data-nemesis-no-rubber"),
  );
}

function pageIsAtTop() {
  return window.scrollY <= 1;
}

function pageIsAtBottom() {
  const pageHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  );

  return Math.ceil(window.scrollY + window.innerHeight) >= pageHeight - 1;
}

function interactionIsBlocked(target) {
  if (
    document.body.dataset.nemesisFilterOpen === "true" ||
    document.body.dataset.nemesisAppLoading === "true"
  ) {
    return true;
  }

  return Boolean(
    target instanceof Element &&
      target.closest(
        '[data-nemesis-no-rubber], [role="dialog"], input, textarea, select, [contenteditable="true"], .fixed.inset-0',
      ),
  );
}

export default function PageRubberEffect() {
  const location = useLocation();
  const gestureRef = useRef({
    active: false,
    mode: null,
    startX: 0,
    startY: 0,
    lastY: 0,
    surface: null,
  });
  const releaseTimerRef = useRef(null);
  const styleSnapshotRef = useRef(new WeakMap());
  const activeSurfaceRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlX: html.style.overscrollBehaviorX,
      htmlY: html.style.overscrollBehaviorY,
      bodyX: body.style.overscrollBehaviorX,
      bodyY: body.style.overscrollBehaviorY,
    };

    html.style.overscrollBehaviorX = "none";
    html.style.overscrollBehaviorY = "none";
    body.style.overscrollBehaviorX = "none";
    body.style.overscrollBehaviorY = "none";

    function rememberStyles(surface) {
      if (!surface || styleSnapshotRef.current.has(surface)) return;

      styleSnapshotRef.current.set(surface, {
        transform: surface.style.transform,
        transition: surface.style.transition,
        willChange: surface.style.willChange,
      });
    }

    function restoreStyles(surface) {
      const snapshot = surface && styleSnapshotRef.current.get(surface);
      if (!surface || !snapshot) return;

      surface.style.transform = snapshot.transform;
      surface.style.transition = snapshot.transition;
      surface.style.willChange = snapshot.willChange;
      styleSnapshotRef.current.delete(surface);
    }

    function setOffset(surface, offset, dragging = true) {
      if (!surface?.isConnected) return;

      rememberStyles(surface);
      surface.style.willChange = "transform";
      surface.style.transition = dragging
        ? "none"
        : `transform ${RELEASE_DURATION}ms cubic-bezier(0.22,1,0.36,1)`;
      surface.style.transform = `translate3d(0, ${offset}px, 0)`;
      activeSurfaceRef.current = surface;
    }

    function release(surface) {
      if (!surface) return;

      window.clearTimeout(releaseTimerRef.current);
      setOffset(surface, 0, false);

      releaseTimerRef.current = window.setTimeout(() => {
        restoreStyles(surface);
        if (activeSurfaceRef.current === surface) {
          activeSurfaceRef.current = null;
        }
      }, RELEASE_DURATION + 30);
    }

    function resetGesture(animate = true) {
      const surface = gestureRef.current.surface;

      gestureRef.current = {
        active: false,
        mode: null,
        startX: 0,
        startY: 0,
        lastY: 0,
        surface: null,
      };

      if (animate) release(surface);
      else restoreStyles(surface);
    }

    function handleTouchStart(event) {
      if (window.innerWidth >= 768 || interactionIsBlocked(event.target)) {
        resetGesture();
        return;
      }

      if (
        event.target instanceof Element &&
        event.target.closest('[data-nemesis-navbar="true"]')
      ) {
        resetGesture();
        return;
      }

      const touch = event.touches[0];
      const surface = findPageSurface();
      if (!touch || !surface) return;

      gestureRef.current = {
        active: true,
        mode: pageIsAtTop() ? "top" : pageIsAtBottom() ? "bottom" : "watch",
        startX: touch.clientX,
        startY: touch.clientY,
        lastY: touch.clientY,
        surface,
      };
    }

    function handleTouchMove(event) {
      const gesture = gestureRef.current;
      const touch = event.touches[0];
      if (!touch) return;

      if (location.pathname === "/" && gesture.active) {
        const edgeDeltaX = touch.clientX - gesture.startX;
        const edgeDeltaY = touch.clientY - gesture.startY;

        if (
          gesture.startX <= 24 &&
          edgeDeltaX > 8 &&
          Math.abs(edgeDeltaX) > Math.abs(edgeDeltaY)
        ) {
          event.preventDefault();
          return;
        }
      }

      if (!gesture.active || interactionIsBlocked(event.target)) return;

      if (gesture.mode === "watch") {
        const movingDown = touch.clientY > gesture.lastY;
        const movingUp = touch.clientY < gesture.lastY;
        gesture.lastY = touch.clientY;

        if (pageIsAtTop() && movingDown) {
          gesture.mode = "top";
          gesture.startX = touch.clientX;
          gesture.startY = touch.clientY;
        } else if (pageIsAtBottom() && movingUp) {
          gesture.mode = "bottom";
          gesture.startX = touch.clientX;
          gesture.startY = touch.clientY;
        }

        return;
      }

      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        resetGesture();
        return;
      }

      const topPull = gesture.mode === "top" && deltaY > 0;
      const bottomPull = gesture.mode === "bottom" && deltaY < 0;
      if (!topPull && !bottomPull) return;

      event.preventDefault();

      const rawDistance = Math.abs(deltaY);
      const maxDistance = topPull ? 112 : 54;
      const resistedDistance = Math.min(
        maxDistance,
        rawDistance * 0.4 + Math.sqrt(rawDistance) * 1.1,
      );

      setOffset(
        gesture.surface,
        topPull ? resistedDistance : -resistedDistance,
      );
    }

    function handleWheel(event) {
      if (
        window.innerWidth < 768 ||
        interactionIsBlocked(event.target) ||
        Math.abs(event.deltaY) < 2
      ) {
        return;
      }

      const topPull = pageIsAtTop() && event.deltaY < 0;
      const bottomPull = pageIsAtBottom() && event.deltaY > 0;
      if (!topPull && !bottomPull) return;

      const surface = findPageSurface();
      if (!surface) return;

      const strength = Math.min(
        34,
        8 + Math.sqrt(Math.abs(event.deltaY)) * 2.2,
      );

      window.clearTimeout(releaseTimerRef.current);
      setOffset(surface, topPull ? strength : -strength, false);

      releaseTimerRef.current = window.setTimeout(() => {
        release(surface);
      }, 90);
    }

    function handleResize() {
      resetGesture();
    }

    const handleTouchEnd = () => resetGesture();

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      html.style.overscrollBehaviorX = previous.htmlX;
      html.style.overscrollBehaviorY = previous.htmlY;
      body.style.overscrollBehaviorX = previous.bodyX;
      body.style.overscrollBehaviorY = previous.bodyY;

      window.clearTimeout(releaseTimerRef.current);
      resetGesture(false);
      restoreStyles(activeSurfaceRef.current);
      activeSurfaceRef.current = null;

      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
    };
  }, [location.pathname]);

  return null;
}