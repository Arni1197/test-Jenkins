// src/components/ProductCard.tsx
import { Link } from "react-router-dom";

export interface ProductCardProps {
  id: number;
  title: string;
  description?: string;
  price: number;
  currency?: string;
}

function ProductCard({
  id,
  title,
  description,
  price,
  currency = "RUB",
}: ProductCardProps) {
  return (
    <Link to={`/catalog/${id}`} className="card-soft" style={{ display: "block" }}>
      <div style={{ marginBottom: 8 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {title}
        </h3>
      </div>
      {description && (
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          {description.slice(0, 120)}
          {description.length > 120 ? "…" : ""}
        </p>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
        }}
      >
        <span
          style={{
            fontWeight: 600,
          }}
        >
          {price} {currency}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          View details →
        </span>
      </div>
    </Link>
  );
}

export default ProductCard;