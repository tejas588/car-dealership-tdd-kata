import { useEffect, useState } from "react";
import {
  CarFront,
  CirclePlus,
  LayoutDashboard,
  Package,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import VehicleForm from "../components/VehicleForm.jsx";
import { money } from "../components/VehicleCard.jsx";
import { api, errorMessage } from "../services/api.js";

export default function AdminPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [restockAmount, setRestockAmount] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const first = await api.get("/vehicles", {
        params: { limit: 100, page: 1 },
      });
      const pages = Math.ceil(first.data.pagination.total / 100);
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
          api.get("/vehicles", { params: { limit: 100, page: index + 2 } }),
        ),
      );
      setVehicles([first, ...rest].flatMap((response) => response.data.data));
    } catch (issue) {
      setMessage({ type: "error", text: errorMessage(issue) });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function run(action, success) {
    setBusy(true);
    try {
      await action();
      setModal(null);
      setMessage({ type: "success", text: success });
      await load();
    } catch (issue) {
      setModal(null);
      setMessage({ type: "error", text: errorMessage(issue) });
    } finally {
      setBusy(false);
    }
  }
  const totalStock = vehicles.reduce(
    (sum, vehicle) => sum + vehicle.quantityInStock,
    0,
  );
  const lowStock = vehicles.filter(
    (vehicle) => vehicle.quantityInStock <= 2,
  ).length;
  return (
    <main className="admin-main container">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">MANAGEMENT CENTER</span>
          <h1>
            Inventory overview<span className="heading-dot">.</span>
          </h1>
          <p>Keep your collection up to date and ready for the road.</p>
        </div>
        <button
          className="btn btn-accent"
          onClick={() => setModal({ type: "create" })}
        >
          <CirclePlus size={18} /> Add vehicle
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">
            <CarFront size={21} />
          </span>
          <span>Total vehicles</span>
          <strong>{vehicles.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Package size={21} />
          </span>
          <span>Units in stock</span>
          <strong>{totalStock}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <LayoutDashboard size={21} />
          </span>
          <span>Low stock models</span>
          <strong>{lowStock}</strong>
        </div>
      </div>
      {message && (
        <div className={`alert alert-${message.type}`} role="status">
          {message.text}
          <button onClick={() => setMessage(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      <div className="inventory-table-wrap">
        <div className="table-heading">
          <div>
            <h2>Your vehicles</h2>
            <p>Manage every car in your collection</p>
          </div>
          <button className="text-button" onClick={load}>
            <RotateCcw size={16} /> Refresh
          </button>
        </div>
        {loading ? (
          <div className="loading-state">
            <span className="spinner" /> Loading inventory…
          </div>
        ) : vehicles.length ? (
          <div className="table-scroll">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <div className="table-vehicle">
                        <span className="table-car">
                          <CarFront size={25} />
                        </span>
                        <span>
                          <strong>
                            {vehicle.make} {vehicle.model}
                          </strong>
                          <small>ID {vehicle.id.slice(0, 8)}</small>
                        </span>
                      </div>
                    </td>
                    <td>{vehicle.category}</td>
                    <td className="table-price">{money(vehicle.price)}</td>
                    <td>
                      <span
                        className={
                          vehicle.quantityInStock ? "stock" : "stock stock-out"
                        }
                      >
                        {vehicle.quantityInStock} in stock
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          title="Edit vehicle"
                          onClick={() => setModal({ type: "edit", vehicle })}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          title="Restock vehicle"
                          onClick={() => {
                            setRestockAmount(1);
                            setModal({ type: "restock", vehicle });
                          }}
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          title="Delete vehicle"
                          className="danger-icon"
                          onClick={() => setModal({ type: "delete", vehicle })}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <CarFront size={48} />
            <h3>No vehicles yet</h3>
            <p>Add your first vehicle to start the collection.</p>
          </div>
        )}
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => !busy && setModal(null)}>
          <div
            className="modal admin-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${modal.type} vehicle`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <span className="eyebrow">INVENTORY MANAGEMENT</span>
            <h2>
              {modal.type === "create"
                ? "Add a vehicle"
                : modal.type === "edit"
                  ? "Edit vehicle"
                  : modal.type === "restock"
                    ? "Restock vehicle"
                    : "Delete vehicle"}
            </h2>
            {["create", "edit"].includes(modal.type) && (
              <VehicleForm
                initial={modal.vehicle}
                busy={busy}
                onCancel={() => setModal(null)}
                onSubmit={(values) =>
                  run(
                    () =>
                      modal.type === "create"
                        ? api.post("/vehicles", values)
                        : api.put(`/vehicles/${modal.vehicle.id}`, values),
                    modal.type === "create"
                      ? "Vehicle added to your inventory."
                      : "Vehicle details updated.",
                  )
                }
              />
            )}
            {modal.type === "restock" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  run(
                    () =>
                      api.post(`/vehicles/${modal.vehicle.id}/restock`, {
                        quantity: Number(restockAmount),
                      }),
                    "Inventory restocked.",
                  );
                }}
              >
                <p className="modal-description">
                  Add units to{" "}
                  <strong>
                    {modal.vehicle.make} {modal.vehicle.model}
                  </strong>
                  . Current stock: {modal.vehicle.quantityInStock}.
                </p>
                <label>
                  Units to add
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={restockAmount}
                    onChange={(event) => setRestockAmount(event.target.value)}
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-accent" disabled={busy}>
                    {busy ? "Restocking…" : "Add stock"}
                  </button>
                </div>
              </form>
            )}
            {modal.type === "delete" && (
              <>
                <p className="modal-description">
                  Delete{" "}
                  <strong>
                    {modal.vehicle.make} {modal.vehicle.model}
                  </strong>
                  ? This cannot be undone. Vehicles with purchase history cannot
                  be deleted.
                </p>
                <div className="modal-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => api.delete(`/vehicles/${modal.vehicle.id}`),
                        "Vehicle deleted.",
                      )
                    }
                  >
                    {busy ? "Deleting…" : "Delete vehicle"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
