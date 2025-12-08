import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import { getCatalogItemById, CatalogItem } from "../api/catalog";

function ProductDetailsPage() {
  const { id } = useParams();

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;

      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        setError("Invalid item id");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await getCatalogItemById(numericId);

        if (!alive) return;
        setItem(res);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load item");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <PageContainer
      title={item?.title ?? "Product"}
      subtitle={item?.slug ? `SKU: ${item.slug}` : undefined}
    >
      <div style={{ marginBottom: 12 }}>
        <Link to="/catalog" style={{ fontSize: 12 }}>
          ← Back to каталог
        </Link>
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Loading…
        </div>
      )}

      {error && (
        <div style={{ fontSize: 13, color: "crimson" }}>
          {error}
        </div>
      )}

      {!loading && !error && item && (
        <div style={{ display: "grid", gap: 10 }}>
          {item.description && (
            <p style={{ margin: 0, fontSize: 14 }}>
              {item.description}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "baseline",
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              {item.price} {item.currency}
            </span>
            {item.isActive === false && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                inactive
              </span>
            )}
          </div>

          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default ProductDetailsPage;