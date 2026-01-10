require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // 完了したジョブの記事を取得
  const article = await prisma.articles.findFirst({
    where: { 
      generation_jobs: { id: 'd4085794-ab67-4b2a-950e-1c5132ddb393' }
    },
    include: {
      article_images: {
        include: {
          media_assets: true
        }
      }
    }
  });
  
  if (!article) {
    console.log('Article not found');
    return;
  }
  
  console.log('Title:', article.title);
  console.log('Thumbnail ID:', article.thumbnailId);
  console.log('\n=== Article Images (inbody) ===');
  
  if (article.article_images.length === 0) {
    console.log('NO INBODY IMAGES FOUND');
  } else {
    for (const img of article.article_images) {
      console.log('- Slot:', img.slot);
      console.log('  URL:', img.media_assets?.url || 'N/A');
    }
  }
  
  await prisma.$disconnect();
}
check().catch(console.error);
