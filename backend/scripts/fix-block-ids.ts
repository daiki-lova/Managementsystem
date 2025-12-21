import prisma from '../src/lib/prisma';

async function main() {
  const article = await prisma.articles.findUnique({
    where: { id: '3ed15d3a-f3e9-4339-bfaa-837a868a2a1d' },
    select: { id: true, blocks: true }
  });

  if (!article) {
    console.log('Article not found');
    return;
  }

  const blocks = article.blocks as any[];
  const fixedBlocks = blocks
    .filter(b => b && typeof b === 'object')
    .map((block, index) => ({
      ...block,
      id: block.id || `block-${Date.now()}-${index}`
    }));

  await prisma.articles.update({
    where: { id: article.id },
    data: { blocks: fixedBlocks }
  });

  console.log('Fixed', fixedBlocks.length, 'blocks');
  console.log('All IDs now:', fixedBlocks.map(b => b.id).slice(-5));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
