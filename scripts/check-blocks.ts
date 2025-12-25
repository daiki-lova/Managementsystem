import prisma from '../src/lib/prisma';

async function main() {
  const article = await prisma.articles.findUnique({
    where: { id: '3ed15d3a-f3e9-4339-bfaa-837a868a2a1d' },
    select: { blocks: true }
  });
  const blocks = article?.blocks as any[];
  console.log('Total blocks:', blocks?.length);
  console.log('Block IDs:', blocks?.map(b => b.id));
  // Check for duplicates
  const ids = blocks?.map(b => b.id) || [];
  const uniqueIds = new Set(ids);
  console.log('Unique IDs:', uniqueIds.size);
  if (ids.length !== uniqueIds.size) {
    console.log('WARNING: Has duplicates!');
  }
  // Check for undefined/null IDs
  const undefinedIds = ids.filter(id => !id);
  if (undefinedIds.length > 0) {
    console.log('WARNING: Has undefined IDs:', undefinedIds.length);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
