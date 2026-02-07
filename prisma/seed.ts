import prisma from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';


async function main() {
  console.log('Starting seed...');

  // Create categories
  const categories = [
    {
      name: 'ชา',
      description: 'เครื่องดื่มชารสชาติต่างๆ',
    },
    {
      name: 'ชาผลไม้',
      description: 'ชาผสมผลไม้สดใหม่',
    },
    {
      name: 'กาแฟ',
      description: 'เครื่องดื่มกาแฟหลากหลาย',
    },
    {
      name: 'สมูทตี้',
      description: 'เครื่องดื่มปั่นเย็นชื่นใจ',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Categories seeded');

  // Create toppings
  const toppings = [
    { name: 'ไข่มุก', description: 'ไข่มุกนุ่มหนึบ', price: 10 },
    { name: 'วุ้นกาแฟ', description: 'วุ้นกาแฟหอม', price: 10 },
    { name: 'คริสตัล', description: 'คริสตัลใส', price: 10 },
    { name: 'พุดดิ้ง', description: 'พุดดิ้งนุ่มละมุน', price: 15 },
    { name: 'ชีสฟอง', description: 'ชีสฟองหอมมัน', price: 20 },
  ];

  for (const topping of toppings) {
    await prisma.topping.upsert({
      where: { name: topping.name },
      update: {},
      create: topping,
    });
  }

  console.log('✅ Toppings seeded');

  console.log('Seed completed successfully! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
