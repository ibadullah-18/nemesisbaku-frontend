export default function SkeletonBlock({
  className = "",
  dark = false,
  style,
}) {
  const skeletonStyle = dark
    ? {
        "--nemesis-skeleton-base": "rgba(255,255,255,0.11)",
        "--nemesis-skeleton-shine": "rgba(255,255,255,0.22)",
        ...style,
      }
    : style;

  return (
    <div
      className={`nemesis-skeleton ${className}`}
      style={skeletonStyle}
      aria-hidden="true"
    />
  );
}