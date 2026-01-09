import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../src/lib/prisma';

async function main() {
  const brands = await prisma.brands.findMany();
  console.log('=== ブランド ===');
  brands.forEach(b => console.log(b.id, '|', b.name, '|', b.slug));

  const authors = await prisma.authors.findMany();
  console.log('\n=== 監修者 ===');
  authors.forEach(a => console.log(a.id, '|', a.name));

  const items = await prisma.knowledge_items.findMany({
    include: { brands: true, authors: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n=== 情報バンク (' + items.length + '件) ===');
  items.forEach((item, i) => {
    console.log('---', i+1, '---');
    console.log('ID:', item.id);
    console.log('内容:', item.content.substring(0, 200) + (item.content.length > 200 ? '...' : ''));
    console.log('ブランド:', item.brands?.name || '【未設定】');
    console.log('ブランドID:', item.brandId || '【未設定】');
    console.log('コース:', item.course || '【未設定】');
    console.log('監修者:', item.authors?.name || '【未設定】');
    console.log('種類:', item.type);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
