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
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-zinc-800">
        {label}
      </span>

      <div className="flex h-14 items-center gap-3 rounded-[14px] border-[1.5px] border-zinc-300 bg-white px-4 transition-all duration-300 focus-within:border-zinc-950 focus-within:shadow-[0_0_0_4px_rgba(36,73,137,0.08)]">
        {icon && <span className="text-lg text-zinc-500">{icon}</span>}

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
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-zinc-400"
        />

        {rightElement}
      </div>
    </label>
  );
}