import { useEffect, useState } from "react";
import {
  ArrowRight,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import VehicleCard from "../components/VehicleCard.jsx";
import { api, errorMessage } from "../services/api.js";

const blank = {
  make: "",
  model: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  inStock: "",
};
export default function VehiclesPage() {
  const [draft, setDraft] = useState(blank);
  const [filters, setFilters] = useState(blank);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    data: [],
    pagination: { total: 0, limit: 9 },
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const active = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ""),
      );
      const path = Object.keys(active).length
        ? "/vehicles/search"
        : "/vehicles";
      const { data } = await api.get(path, {
        params: { ...active, page, limit: 9 },
      });
      setResult(data);
    } catch (issue) {
      setMessage({ type: "error", text: errorMessage(issue) });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [filters, page]);

  function apply(event) {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draft });
    setMessage(null);
  }
  async function purchase() {
    setBusy(true);
    try {
      await api.post(`/vehicles/${selected.id}/purchase`);
      setMessage({
        type: "success",
        text: `Congratulations! Your ${selected.make} ${selected.model} is yours.`,
      });
      setSelected(null);
      await load();
    } catch (issue) {
      setSelected(null);
      setMessage({ type: "error", text: errorMessage(issue) });
      await load();
    } finally {
      setBusy(false);
    }
  }
  const totalPages = Math.max(1, Math.ceil(result.pagination.total / 9));
  const set = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <main>
      <section className="catalog-hero">
        <div className="container catalog-hero-inner">
          <div>
            <span className="hero-kicker dark-kicker">
              CURATED FOR THE ROAD AHEAD
            </span>
            <h1>
              Find your
              <br />
              <em>perfect drive.</em>
            </h1>
            <p>
              Explore a handpicked collection of vehicles ready for whatever
              comes next.
            </p>
            <a href="#inventory" className="btn btn-accent">
              Explore collection <ArrowRight size={17} />
            </a>
          </div>
          <div className="catalog-hero-art">
            <span className="hero-ring ring-one" />
            <span className="hero-ring ring-two" />
            <CarFront size={275} strokeWidth={0.7} />
            <span className="hero-art-note">DRIVE BEYOND ORDINARY</span>
          </div>
        </div>
      </section>
      <section id="inventory" className="container inventory-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">OUR COLLECTION</span>
            <h2>
              Explore the lineup<span className="heading-dot">.</span>
            </h2>
            <p>Find the one that fits your life.</p>
          </div>
          <div className="vehicle-count">
            <CarFront size={18} /> {result.pagination.total} vehicles
          </div>
        </div>
        <form onSubmit={apply} className="filter-panel">
          <div className="filter-head">
            <SlidersHorizontal size={18} />
            <strong>Find your match</strong>
          </div>
          <div className="filters">
            <label>
              Make
              <input
                value={draft.make}
                onChange={(e) => set("make", e.target.value)}
                placeholder="Any make"
              />
            </label>
            <label>
              Model
              <input
                value={draft.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="Any model"
              />
            </label>
            <label>
              Category
              <select
                value={draft.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="">All types</option>
                <option>SUV</option>
                <option>Sedan</option>
                <option>Hatchback</option>
                <option>Coupe</option>
                <option>Electric</option>
              </select>
            </label>
            <label>
              Min price
              <input
                type="number"
                min="0"
                value={draft.minPrice}
                onChange={(e) => set("minPrice", e.target.value)}
                placeholder="₹ Min"
              />
            </label>
            <label>
              Max price
              <input
                type="number"
                min="0"
                value={draft.maxPrice}
                onChange={(e) => set("maxPrice", e.target.value)}
                placeholder="₹ Max"
              />
            </label>
            <label>
              Availability
              <select
                value={draft.inStock}
                onChange={(e) => set("inStock", e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">In stock</option>
                <option value="false">Sold out</option>
              </select>
            </label>
          </div>
          <div className="filter-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setDraft(blank);
                setFilters(blank);
                setPage(1);
              }}
            >
              Clear filters
            </button>
            <button className="btn btn-dark">
              <Search size={17} /> Search vehicles
            </button>
          </div>
        </form>
        {message && (
          <div className={`alert alert-${message.type}`} role="status">
            {message.text}
            <button onClick={() => setMessage(null)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}
        {loading ? (
          <div className="loading-state">
            <span className="spinner" /> Finding your next drive…
          </div>
        ) : result.data.length ? (
          <div className="vehicle-grid">
            {result.data.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPurchase={setSelected}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <CarFront size={56} />
            <h3>No vehicles found</h3>
            <p>Try changing your filters to see more of our collection.</p>
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={18} /> Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>
      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !busy && setSelected(null)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm purchase"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-icon">
              <CarFront size={28} />
            </div>
            <h2>Ready to make it yours?</h2>
            <p>
              You're about to purchase the{" "}
              <strong>
                {selected.make} {selected.model}
              </strong>
              . One vehicle will be reserved from our inventory.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-outline"
                disabled={busy}
                onClick={() => setSelected(null)}
              >
                Not yet
              </button>
              <button
                className="btn btn-accent"
                disabled={busy}
                onClick={purchase}
              >
                {busy ? "Processing…" : "Confirm purchase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
