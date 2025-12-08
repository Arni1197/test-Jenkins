import { useEffect, useMemo, useState } from "react";
import PageContainer from "../components/PageContainer";
import ProductCard from "../components/ProductCard";
import { getCatalogItems, CatalogItem } from "../api/catalog";

function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await getCatalogItems(page, limit);

        if (!alive) return;

        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load catalog");
      } finally {
    if (!alive) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [page, limit]);

  return (
    <PageContainer
      title="Catalog"
      subtitle="Browse items available in the store"
    >
      {loading && (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Loading items…
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: 13,
            color: "crimson",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          No items found.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((item) => (
          <ProductCard
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            price={item.price}
            currency={item.currency}
          />
        ))}
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Page {page} of {totalPages} • Total {total}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-soft"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <button
            className="btn-soft"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

export default CatalogPage;