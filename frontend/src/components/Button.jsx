const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  outline: "border border-brand-200 text-brand-700 hover:bg-brand-50",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
};

export default function Button({ variant = "primary", className = "", loading, children, ...props }) {
  return (
    <button
      className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
