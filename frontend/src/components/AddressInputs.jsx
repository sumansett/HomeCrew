import { parseAddress } from "../utils/address";

export default function AddressInputs({
  value,
  onChange,
  required = false,
  className = "",
  legend = "Address details",
}) {
  const addr = parseAddress(value);

  const update = (key, val) => {
    onChange({ ...addr, [key]: val });
  };

  return (
    <div className={`space-y-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          📍 {legend} {required && <span className="text-red-500">*</span>}
        </span>
      </div>

      {/* Street / Flat / Area */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Street name / House no. / Area {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={addr.street}
          onChange={(e) => update("street", e.target.value)}
          placeholder="Flat / House no., Street, Locality"
          required={required}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Post Office & District */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Post Office {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={addr.postOffice}
            onChange={(e) => update("postOffice", e.target.value)}
            placeholder="Post Office name"
            required={required}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            District {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={addr.district}
            onChange={(e) => update("district", e.target.value)}
            placeholder="District name"
            required={required}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* State & PIN Code */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            State {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={addr.state}
            onChange={(e) => update("state", e.target.value)}
            placeholder="e.g. West Bengal, Maharashtra"
            required={required}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            PIN Code {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={addr.pinCode}
            onChange={(e) => update("pinCode", e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit PIN"
            required={required}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>
    </div>
  );
}
