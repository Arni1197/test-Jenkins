import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      name: 'Mechanical Keyboard K8',
      description: 'Wireless mechanical keyboard with hot-swappable switches',
      price: '89.99',
      stock: 15,
      category: 'electronics',
      isActive: true,
    },
    {
      name: 'Gaming Mouse M5',
      description: 'Ergonomic gaming mouse with adjustable DPI',
      price: '49.90',
      stock: 25,
      category: 'electronics',
      isActive: true,
    },
    {
      name: '27-inch Monitor Pro',
      description: '27-inch IPS monitor with 1440p resolution',
      price: '249.00',
      stock: 8,
      category: 'electronics',
      isActive: true,
    },
    {
      name: 'USB-C Hub 7-in-1',
      description: 'Multiport adapter with HDMI, USB and SD card support',
      price: '39.50',
      stock: 30,
      category: 'accessories',
      isActive: true,
    },
    {
      name: 'Laptop Stand Aluminum',
      description: 'Adjustable aluminum stand for laptops up to 17 inches',
      price: '34.99',
      stock: 20,
      category: 'office',
      isActive: true,
    },
    {
      name: 'Noise Cancelling Headset H9',
      description: 'Over-ear headset with noise cancellation and microphone',
      price: '129.00',
      stock: 12,
      category: 'electronics',
      isActive: true,
    },
    {
      name: 'Webcam Full HD',
      description: '1080p webcam for calls and streaming',
      price: '59.99',
      stock: 18,
      category: 'electronics',
      isActive: true,
    },
    {
      name: 'USB Microphone Studio',
      description: 'USB condenser microphone for podcasting and meetings',
      price: '99.00',
      stock: 10,
      category: 'electronics',
      isActive: true,
    },
    {
      name: 'Desk Lamp LED',
      description: 'LED desk lamp with adjustable brightness and color temperature',
      price: '29.99',
      stock: 22,
      category: 'office',
      isActive: true,
    },
    {
      name: 'Office Chair Comfort',
      description: 'Comfortable ergonomic office chair with lumbar support',
      price: '199.00',
      stock: 6,
      category: 'furniture',
      isActive: true,
    },
    {
      name: 'Notebook Classic',
      description: 'Hardcover notebook for daily notes and planning',
      price: '12.50',
      stock: 40,
      category: 'office',
      isActive: true,
    },
    {
      name: 'Phone Stand Mini',
      description: 'Compact stand for smartphones and small tablets',
      price: '14.99',
      stock: 35,
      category: 'accessories',
      isActive: true,
    },
    {
      name: 'Portable SSD 1TB',
      description: 'Fast portable SSD with USB-C connection',
      price: '119.00',
      stock: 14,
      category: 'electronics',
      isActive: true,
    },
    {
      name: 'Backpack Urban Tech',
      description: 'Backpack with laptop compartment and water-resistant fabric',
      price: '79.00',
      stock: 16,
      category: 'accessories',
      isActive: true,
    },
    {
      name: 'Fast Charger 65W',
      description: 'USB-C fast charger for laptops, phones and tablets',
      price: '44.00',
      stock: 28,
      category: 'electronics',
      isActive: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        isActive: product.isActive,
      },
      create: product,
    });
  }

  const total = await prisma.product.count();
  console.log(`Seed completed. Products in catalog: ${total}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });