export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-brand-700">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
