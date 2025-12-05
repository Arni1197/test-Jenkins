// src/pages/ProductDetailsPage.tsx
import { useParams, Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";

function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();

  // TODO: здесь сделать fetch к catalog-service по /catalog/items/:id
  return (
    <PageContainer
      title={`Item #${id}`}
      subtitle="Страница товара. Позже привяжем к реальному catalog-service."
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div className="card-soft">
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Название товара</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Здесь будет подробное описание, характеристики и кнопка “Создать
            заказ” через OrderService.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="button-primary">Добавить в заказ (позже)</button>
          <Link to="/catalog">
            <button className="button-ghost">← Назад к каталогу</button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

export default ProductDetailsPage;