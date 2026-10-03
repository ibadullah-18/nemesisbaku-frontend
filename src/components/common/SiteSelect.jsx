import { Children, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown, FiX } from "react-icons/fi";
import "./siteSelect.css";
import { useLanguage } from "../../i18n/LanguageContext";

export default function SiteSelect({ children, value, onChange, className = "", disabled, id, name, required, ...props }) {
  const { lang } = useLanguage();
  const options = Children.toArray(children).filter(child => child?.type === "option");
  const trigger = useRef(null);
  const panel = useRef(null);
  const uid = useId();
  const [position, setPosition] = useState(null);
  const selected = options.find(option => String(option.props.value) === String(value ?? ""));
  function close() { setPosition(null); trigger.current?.focus({ preventScroll: true }); }
  useEffect(() => {
    if (!position) return;
    const node = panel.current;
    (node?.querySelector('[aria-selected="true"]') || node?.querySelector('[role="option"]'))?.focus({ preventScroll: true });
    const dismiss = event => { if (!panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) setPosition(null); };
    const resize = () => setPosition(null);
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", resize);
    return () => { document.removeEventListener("pointerdown", dismiss); window.removeEventListener("resize", resize); };
  }, [position]);
  function keyDown(event) {
    event.stopPropagation();
    if (event.target.closest(".nb-select-close") && event.key !== "Escape") return;
    const items = [...panel.current.querySelectorAll('[role="option"]:not(:disabled)')];
    const index = items.indexOf(document.activeElement);
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key === "Tab") { close(); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
        (index + (event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey) ? -1 : 1) + items.length) % items.length;
      items[next]?.focus();
    } else if (event.key.length === 1 && event.key !== " ") {
      items.find(item => item.textContent.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()))?.focus();
    }
  }
  return <>
    {name && <input type="hidden" name={name} value={value ?? ""} disabled={disabled} />}
    <button {...props} id={id} ref={trigger} type="button" disabled={disabled}
      className={`nb-select-trigger ${className}`} aria-haspopup="listbox" aria-expanded={!!position} aria-controls={position ? uid : undefined} aria-required={required || undefined}
      onClick={() => {
        const r = trigger.current.getBoundingClientRect();
        const width = Math.min(Math.max(r.width, 180), window.innerWidth - 24);
        const below = window.innerHeight - r.bottom - 20;
        const height = Math.min(320, Math.max(below, r.top - 20));
        setPosition(position ? null : { left: Math.max(12, Math.min(r.left, window.innerWidth - width - 12)),
          top: below >= Math.min(180, options.length * 44 + 12) ? r.bottom + 6 : Math.max(12, r.top - height - 6),
          width, maxHeight: Math.max(100, Math.min(height, below >= 180 ? below : height)) });
      }}>
      <span>{selected?.props.children ?? "—"}</span><FiChevronDown aria-hidden="true" />
    </button>
    {position && createPortal(<div className="nb-select-layer" data-nemesis-no-rubber data-filter-scroll-area="true" onKeyDown={keyDown}>
      <div className="nb-select-shade" onClick={close} />
      <div className="nb-select-panel" ref={panel} style={position}>
        <button className="nb-select-close" type="button" aria-label={lang === "az" ? "Bağla" : lang === "ru" ? "Закрыть" : "Close"} onClick={close}><FiX /></button>
        <div id={uid} role="listbox" aria-label={props["aria-label"] || selected?.props.children || ""} className="nb-select-options">
          {options.map((option, index) => <button type="button" role="option" key={String(option.props.value) + index} disabled={option.props.disabled}
            aria-selected={String(option.props.value) === String(value ?? "")} onClick={() => { onChange?.({ target: { value: String(option.props.value), name } }); close(); }}>
            <span>{option.props.children}</span>{String(option.props.value) === String(value ?? "") && <FiCheck aria-hidden="true" />}
          </button>)}
        </div>
      </div>
    </div>, document.body)}
  </>;
}
