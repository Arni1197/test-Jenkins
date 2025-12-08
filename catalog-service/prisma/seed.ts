import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const items = [
  {
    slug: "starter-pack",
    title: "Starter Pack",
    description: "Базовый набор для старта.",
    price: 9900, // копейки
    currency: "RUB",
    isActive: true,
  },
  {
    slug: "pro-pack",
    title: "Pro Pack",
    description: "Расширенный набор.",
    price: 19900,
    currency: "RUB",
    isActive: true,
  },
  {
    slug: "legacy-item",
    title: "Legacy Item",
    description: "Старый товар, оставлен для истории.",
    price: 4990,
    currency: "RUB",
    isActive: false,
  },
  // добавь сюда свои 20-30 товаров
];

async function main() {
  // Идемпотентно: обновит существующие по slug или создаст новые
  for (const item of items) {
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency ?? "RUB",
        isActive: item.isActive ?? true,
      },
      create: {
        slug: item.slug,
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency ?? "RUB",
        isActive: item.isActive ?? true,
      },
    });
  }

  // полезно для локальной чистоты:
  // можно выключать товары, которых больше нет в списке
  const slugs = items.map(i => i.slug);
  await prisma.item.updateMany({
    where: { slug: { notIn: slugs } },
    data: { isActive: false },
  });
}

main()
  .then(() => console.log("✅ Catalog seed completed"))
  .catch((e) => {
    console.error("❌ Catalog seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });