import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCalendar, FiClock } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";
import "./dateWheel.css";
import { localToday, readDateParts, writeDateParts, clampDateParts, dateWheelBounds } from "./dateWheelUtils";

const labels = {
  az: { months: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"], timeTitle: "Saat seçin", title: "Tarix seçin", day: "Gün", month: "Ay", year: "İl", hour: "Saat", minute: "Dəqiqə", done: "Təsdiqlə", cancel: "Ləğv et", clear: "Təmizlə" },
  en: { months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], timeTitle: "Select time", title: "Select date", day: "Day", month: "Month", year: "Year", hour: "Hour", minute: "Minute", done: "Confirm", cancel: "Cancel", clear: "Clear" },
  ru: { months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"], timeTitle: "Выберите время", title: "Выберите дату", day: "День", month: "Месяц", year: "Год", hour: "Час", minute: "Минута", done: "Подтвердить", cancel: "Отмена", clear: "Очистить" },
};
const pad = n => String(n).padStart(2, "0");
const range = (start, end) => Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

export default function SiteInput({ noPast, ...props }) {
  return props.type === "date" || props.type === "datetime-local" || props.type === "time" ? <DateInput {...props} noPast={noPast} /> : <input {...props} />;
}

function DateInput({ value = "", onChange, type, min, max, noPast = false, disabled, readOnly, className = "", name, id, required, placeholder, onFocus, onBlur, ...rest }) {
  const { lang } = useLanguage();
  const t = labels[lang] || labels.az;
  const today = localToday();
  const earliest = noPast ? (type === "datetime-local" ? today + "T00:00" : today) : undefined;
  const effectiveMin = earliest && (!min || min < earliest) ? earliest : min;
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const date = value ? new Date(value.length === 10 ? value + "T12:00:00" : value) : null;
  const display = type === "time" ? (value || placeholder || t.timeTitle) : date && !Number.isNaN(date.getTime()) ? `${pad(date.getDate())} ${t.months[date.getMonth()]} ${date.getFullYear()}${type === "datetime-local" ? ` · ${pad(date.getHours())}:${pad(date.getMinutes())}` : ""}` : placeholder || t.title;
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  return <>
    <button {...rest} id={id} ref={trigger} type="button" className={`nb-date-trigger ${className}`} disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-required={required || undefined}
      onFocus={onFocus} onBlur={onBlur} onClick={() => { if (!readOnly) setOpen(true); }}><span>{display}</span>{type === "time" ? <FiClock aria-hidden="true" /> : <FiCalendar aria-hidden="true" />}</button>
    <input type={type} className="nb-date-validation" tabIndex={-1} aria-hidden="true" name={name} value={value || ""} min={effectiveMin} max={max} required={required} disabled={disabled} readOnly={readOnly} onChange={onChange}
      onInvalid={event => { event.preventDefault(); trigger.current?.focus(); setOpen(true); }} />
    {open && createPortal(<DatePanel value={value} type={type} min={effectiveMin} max={max} t={t} required={required} close={close}
      commit={next => { onChange?.({ target: { value: next, name }, currentTarget: { value: next, name } }); close(); }} />, document.body)}
  </>;
}

function DatePanel({ value: inputValue, type, min: inputMin, max: inputMax, t, required, close, commit }) {
  const now = new Date();
  const today = localToday(now);
  const timeOnly = type === "time";
  const withTime = timeOnly || type === "datetime-local";
  const value = timeOnly ? today + "T" + (inputValue || "12:00") : inputValue;
  const min = timeOnly && inputMin ? today + "T" + inputMin : inputMin;
  const max = timeOnly && inputMax ? today + "T" + inputMax : inputMax;
  const title = timeOnly ? t.timeTitle : t.title;
  const initial = value || (min && min > today ? min : max && max < today ? max : today);
  const [parts, setParts] = useState(() => clampDateParts(readDateParts(initial), min, max, withTime));
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector('[role="spinbutton"]')?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previous; };
  }, []);
  const result = writeDateParts(parts, withTime);
  const valid = (!min || result >= min) && (!max || result <= max);
  const bounds = dateWheelBounds(parts, min, max, now.getFullYear());
  const update = (key, next) => setParts(old => clampDateParts({ ...old, [key]: next }, min, max, withTime));
  function keyDown(event) {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key === "Tab") {
      const nodes = [...panel.current.querySelectorAll('button:not(:disabled),[tabindex="0"]')];
      const current = nodes.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) { event.preventDefault(); nodes.at(-1)?.focus(); }
      else if (!event.shiftKey && current === nodes.length - 1) { event.preventDefault(); nodes[0]?.focus(); }
    }
  }
  return <div className="nb-date-layer" data-nemesis-no-rubber data-filter-scroll-area="true" onKeyDown={keyDown}>
    <div className="nb-date-backdrop" onClick={close} />
    <section ref={panel} role="dialog" aria-modal="true" aria-label={title} className={`nb-date-panel ${timeOnly ? "nb-time-panel" : ""}`}>
      <div className="nb-date-heading"><button type="button" onClick={close}>{t.cancel}</button><strong>{title}</strong><button type="button" disabled={!valid} onClick={() => commit(timeOnly ? result.slice(11, 16) : result)}>{t.done}</button></div>
      {!timeOnly && <div className="nb-date-wheels">
        <Wheel label={t.day} values={range(...bounds.day)} value={parts.day} onChange={n => update("day", n)} />
        <Wheel label={t.month} values={range(...bounds.month)} value={parts.month} format={n => t.months[n - 1]} onChange={n => update("month", n)} />
        <Wheel label={t.year} values={range(...bounds.year)} value={parts.year} onChange={n => update("year", n)} />
      </div>}
      {withTime && <div className="nb-date-wheels nb-date-wheels--time">
        <Wheel label={t.hour} values={range(...bounds.hour)} value={parts.hour} format={pad} onChange={n => update("hour", n)} />
        <Wheel label={t.minute} values={range(...bounds.minute)} value={parts.minute} format={pad} onChange={n => update("minute", n)} />
      </div>}
      {!required && <button type="button" className="nb-date-clear" onClick={() => commit("")}>{t.clear}</button>}
    </section>
  </div>;
}

function Wheel({ label, values, value, format = String, onChange }) {
  const rail = useRef(null);
  const active = useRef(value);
  const timer = useRef(null);
  const interacting = useRef(false);
  const signature = values.join(",");
  const previousSignature = useRef(signature);
  useEffect(() => {
    if (previousSignature.current !== signature) { interacting.current = false; previousSignature.current = signature; }
    active.current = value;
    const index = signature.split(",").map(Number).indexOf(value);
    if (rail.current && !interacting.current) rail.current.scrollTop = Math.max(0, index) * 44;
  }, [value, signature]);
  useEffect(() => () => clearTimeout(timer.current), []);
  function choose(next) {
    if (next !== active.current) {
      active.current = next;
      if (typeof navigator.vibrate === "function") navigator.vibrate(7);
      onChange(next);
    }
  }
  return <div className="nb-date-column"><span className="nb-date-label">{label}</span><div className="nb-date-window">
    <div className="nb-date-highlight" />
    <div ref={rail} className="nb-date-rail" role="spinbutton" tabIndex={0} aria-label={label} aria-valuemin={values[0]} aria-valuemax={values.at(-1)} aria-valuenow={value} aria-valuetext={format(value)}
      onTouchStart={() => { interacting.current = true; }} onWheel={() => { interacting.current = true; }}
      onScroll={() => {
        const index = Math.max(0, Math.min(values.length - 1, Math.round(rail.current.scrollTop / 44)));
        choose(values[index]);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { interacting.current = false; }, 140);
      }}
      onKeyDown={event => {
        const index = values.indexOf(value);
        const next = event.key === "ArrowDown" ? index + 1 : event.key === "ArrowUp" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? values.length - 1 : null;
        if (next !== null) { event.preventDefault(); interacting.current = false; choose(values[Math.max(0, Math.min(values.length - 1, next))]); }
      }}>
      {values.map(n => <div key={n} className="nb-date-tick" aria-hidden="true" data-active={n === value} style={{ "--wheel-offset": Math.max(-3, Math.min(3, values.indexOf(n) - values.indexOf(value))) }} onClick={() => { interacting.current = false; choose(n); rail.current.scrollTo({ top: values.indexOf(n) * 44, behavior: "smooth" }); }}>{format(n)}</div>)}
    </div>
  </div></div>;
}
