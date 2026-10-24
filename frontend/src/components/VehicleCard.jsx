import { CarFront, Fuel, Gauge, ShoppingBag } from "lucide-react";

const shades = ["#eee8df", "#e5eced", "#e8e8ed", "#eee9e4", "#e5e7e1"];
export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function VehicleCard({
  vehicle,
  onPurchase,
  busy = false,
  adminActions,
}) {
  const out = vehicle.quantityInStock === 0;
  const shade =
    shades[(vehicle.make.length + vehicle.model.length) % shades.length];
  return (
    <article className="vehicle-card">
      <div className="vehicle-art" style={{ background: shade }}>
        <span className="vehicle-category">{vehicle.category}</span>
        <div className="car-illustration">
          <CarFront size={104} strokeWidth={1.15} />
        </div>
        <span className="vehicle-art-caption">
          THE {vehicle.make.toUpperCase()} COLLECTION
        </span>
      </div>
      <div className="vehicle-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{vehicle.make}</p>
            <h3 className="vehicle-title">{vehicle.model}</h3>
          </div>
          <span className={out ? "stock stock-out" : "stock"}>
            {out ? "Sold out" : `${vehicle.quantityInStock} available`}
          </span>
        </div>
        <div className="vehicle-specs">
          <span>
            <Gauge size={15} /> Premium drive
          </span>
          <span>
            <Fuel size={15} /> Ready to go
          </span>
        </div>
        <div className="vehicle-footer">
          <div>
            <span className="price-label">STARTING AT</span>
            <strong className="vehicle-price">{money(vehicle.price)}</strong>
          </div>
          {adminActions || (
            <button
              className="btn btn-dark card-button"
              disabled={out || busy}
              onClick={() => onPurchase(vehicle)}
            >
              <ShoppingBag size={16} /> {busy ? "Processing" : "Purchase"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
