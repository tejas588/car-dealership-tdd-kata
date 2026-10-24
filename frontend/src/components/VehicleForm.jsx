import { useState } from "react";

const empty = {
  make: "",
  model: "",
  category: "SUV",
  price: "",
  quantityInStock: 0,
};
export default function VehicleForm({ initial, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(initial || empty);
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      price: String(form.price),
      quantityInStock: Number(form.quantityInStock),
    });
  }
  return (
    <form onSubmit={submit} className="form-grid">
      <label>
        Make
        <input
          required
          maxLength="100"
          value={form.make}
          onChange={(e) => set("make", e.target.value)}
          placeholder="e.g. Hyundai"
        />
      </label>
      <label>
        Model
        <input
          required
          maxLength="100"
          value={form.model}
          onChange={(e) => set("model", e.target.value)}
          placeholder="e.g. Creta"
        />
      </label>
      <label>
        Category
        <select
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
        >
          <option>SUV</option>
          <option>Sedan</option>
          <option>Hatchback</option>
          <option>Coupe</option>
          <option>Electric</option>
          <option>Other</option>
        </select>
      </label>
      <label>
        Price (₹)
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          value={form.price}
          onChange={(e) => set("price", e.target.value)}
        />
      </label>
      <label>
        Quantity in stock
        <input
          required
          type="number"
          min="0"
          step="1"
          value={form.quantityInStock}
          onChange={(e) => set("quantityInStock", e.target.value)}
        />
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button disabled={busy} className="btn btn-accent">
          {busy ? "Saving…" : initial ? "Save changes" : "Add vehicle"}
        </button>
      </div>
    </form>
  );
}
