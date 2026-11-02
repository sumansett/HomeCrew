// Works as <input>, <textarea> (as="textarea") or <select> (as="select")
export default function FormInput({ label, extra, as = "input", children, className = "", ...props }) {
  const base =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
  const Tag = as;
  return (
    <div className={`block ${className}`}>
      {(label || extra) && (
        <div className="mb-1 flex items-center justify-between">
          {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
          {extra}
        </div>
      )}
      <Tag className={base} {...props}>
        {children}
      </Tag>
    </div>
  );
}
