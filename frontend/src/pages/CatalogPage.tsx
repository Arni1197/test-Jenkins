// src/pages/CatalogPage.tsx
import PageContainer from "../components/PageContainer";
import ProductCard from "../components/ProductCard";

const mockItems = [
  {
    id: 1,
    title: "Legendary Sword",
    description: "Мощный меч для теста микросервисов и нагрузочного профайлинга.",
    price: 500,
    currency: "GOLD",
  },
  {
    id: 2,
    title: "DevOps Shield",
    description: "Щит от падений продакшена: Helm, ArgoCD, Prometheus.",
    price: 750,
    currency: "GOLD",
  },
  {
    id: 3,
    title: "SRE Helmet",
    description: "Повышает внимательность к метрикам и логам.",
    price: 320,
    currency: "GOLD",
  },
];

function CatalogPage() {
  return (
    <PageContainer
      title="Catalog"
      subtitle="Позже здесь будут реальные данные из catalog-service."
    >
      <div className="products-grid">
        {mockItems.map((item) => (
          <ProductCard key={item.id} {...item} />
        ))}
      </div>
    </PageContainer>
  );
}

export default CatalogPage;