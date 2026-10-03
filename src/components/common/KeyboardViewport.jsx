import { useEffect } from "react";

export default function KeyboardViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let session = null;
    let frame = 0;
    let timer = 0;
    const editable = node => node instanceof HTMLElement && node.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, [contenteditable=true]');
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--nb-viewport-height', `${viewport.height}px`);
        const active = document.activeElement;
        if (!session || !editable(active) || viewport.scale !== 1) return;
        const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
        document.body.style.paddingBottom = (session.padding + inset) + 'px';
        const rect = active.getBoundingClientRect();
        const top = viewport.offsetTop + 16;
        const bottom = viewport.offsetTop + viewport.height - 20;
        let delta = rect.bottom > bottom ? rect.bottom - bottom : rect.top < top ? rect.top - top : 0;
        for (let node = active.parentElement; node && Math.abs(delta) > 1; node = node.parentElement) {
          if (node === document.body || node === document.documentElement) break;
          if (node.scrollHeight > node.clientHeight && /auto|scroll/.test(getComputedStyle(node).overflowY)) {
            const before = node.scrollTop;
            node.scrollTop += delta;
            delta -= node.scrollTop - before;
          }
        }
        if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
      });
    }
    function focus(event) {
      if (!window.matchMedia('(pointer: coarse)').matches || !editable(event.target)) return;
      clearTimeout(timer);
      if (!session) {
        const scrolls = [];
        for (let node = event.target.parentElement; node; node = node.parentElement) {
          if (node.scrollHeight > node.clientHeight && /auto|scroll/.test(getComputedStyle(node).overflowY)) scrolls.push([node, node.scrollTop]);
        }
        session = { x: window.scrollX, y: window.scrollY, scrolls, route: location.pathname, paddingStyle: document.body.style.paddingBottom, padding: parseFloat(getComputedStyle(document.body).paddingBottom) || 0 };
      }
      update();
    }
    function blur() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (editable(document.activeElement) || !session) return;
        const saved = session;
        session = null;
        document.body.style.paddingBottom = saved.paddingStyle;
        if (saved.route === location.pathname) {
          saved.scrolls.forEach(([node, top]) => { if (node.isConnected) node.scrollTop = top; });
          window.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
        }
      }, 350);
    }
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', blur);
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    update();
    return () => {
      cancelAnimationFrame(frame); clearTimeout(timer);
      if (session) document.body.style.paddingBottom = session.paddingStyle;
      document.removeEventListener('focusin', focus); document.removeEventListener('focusout', blur);
      viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--nb-viewport-height');
    };
  }, []);
  return null;
}
