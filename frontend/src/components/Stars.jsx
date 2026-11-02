// ★★★★☆ rating display
export default function Stars({ value = 0, className = "" }) {
  const full = Math.round(value);
  return (
    <span className={`tracking-wide text-amber-400 ${className}`} aria-label={`${value} out of 5`}>
      {"★".repeat(full)}
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}
