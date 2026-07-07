export default function AnimatedInput({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  rightElement,
  maxLength,
  inputMode,
  autoComplete = "off",
}) {
  const hasValue = String(value || "").length > 0;

  return (
    <label className="group block">
      {label && (
        <span className="mb-2 block text-[13px] font-extrabold tracking-[-0.01em] text-zinc-700 transition duration-300 group-focus-within:text-zinc-950">
          {label}
        </span>
      )}

      <div
        className={`relative flex h-14 items-center gap-3 overflow-hidden rounded-[18px] border bg-white px-4 transition-all duration-300 ${
          hasValue
            ? "border-zinc-400 shadow-[0_14px_34px_rgba(0,0,0,0.055)]"
            : "border-zinc-200 shadow-[0_10px_28px_rgba(0,0,0,0.035)]"
        } focus-within:border-zinc-950 focus-within:shadow-[0_16px_42px_rgba(0,0,0,0.075)]`}
      >
        <span className="pointer-events-none absolute inset-x-4 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-zinc-950 transition-transform duration-500 group-focus-within:scale-x-100" />

        {icon && (
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 ${
              hasValue
                ? "bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-500 group-focus-within:bg-zinc-950 group-focus-within:text-white"
            }`}
          >
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={autoComplete}
          autoCorrect="off"
          spellCheck="false"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-zinc-950 outline-none placeholder:font-medium placeholder:text-zinc-400"
        />

        {rightElement && (
          <span className="shrink-0 text-zinc-500 transition group-focus-within:text-zinc-950">
            {rightElement}
          </span>
        )}
      </div>
    </label>
  );
}