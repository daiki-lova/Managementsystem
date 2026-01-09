import { config } from 'dotenv';
config({ path: '.env.local' });

import prisma from '../src/lib/prisma';

/**
 * 情報バンクのブランド・コース・監修者を内容から推測して更新するスクリプト
 *
 * 実行方法:
 * npx tsx scripts/update-knowledge-items.ts
 */

async function main() {
  console.log('🔍 情報バンクのデータを取得中...\n');

  // ブランド一覧を取得
  const brands = await prisma.brands.findMany();
  console.log('=== ブランド一覧 ===');
  brands.forEach(b => console.log(`  ${b.id} | ${b.name} | ${b.slug}`));

  // 監修者一覧を取得
  const authors = await prisma.authors.findMany();
  console.log('\n=== 監修者一覧 ===');
  authors.forEach(a => console.log(`  ${a.id} | ${a.name}`));

  // ブランドIDのマッピング
  const brandMap: Record<string, string> = {};
  brands.forEach(b => {
    brandMap[b.slug.toLowerCase()] = b.id;
    brandMap[b.name.toLowerCase()] = b.id;
  });

  // 情報バンクを取得
  const items = await prisma.knowledge_items.findMany({
    include: { brands: true, authors: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n📊 情報バンク: ${items.length}件\n`);

  let updateCount = 0;

  for (const item of items) {
    const updates: { brandId?: string; course?: string } = {};
    const content = item.content.toLowerCase();
    const title = item.title?.toLowerCase() || '';

    // ========================================
    // ブランドの推測
    // ========================================
    if (!item.brandId) {
      if (content.includes('oreo') || title.includes('oreo')) {
        const oreoBrand = brands.find(b => b.slug.toLowerCase() === 'oreo' || b.name.toLowerCase().includes('oreo'));
        if (oreoBrand) {
          updates.brandId = oreoBrand.id;
        }
      } else if (content.includes('sequence') || title.includes('sequence')) {
        const seqBrand = brands.find(b => b.slug.toLowerCase() === 'sequence' || b.name.toLowerCase().includes('sequence'));
        if (seqBrand) {
          updates.brandId = seqBrand.id;
        }
      }
    }

    // ========================================
    // コースの推測
    // ========================================
    if (!item.course) {
      if (content.includes('ryt200') || content.includes('ryt 200')) {
        updates.course = 'RYT200';
      } else if (content.includes('ryt500') || content.includes('ryt 500')) {
        updates.course = 'RYT500';
      } else if (content.includes('rpy85') || content.includes('rpy 85')) {
        updates.course = 'RPY85';
      } else if (content.includes('rcyt95') || content.includes('rcyt 95')) {
        updates.course = 'RCYT95';
      } else if (content.includes('ピラティス')) {
        updates.course = 'ピラティス基礎';
      } else if (content.includes('短期集中')) {
        updates.course = '短期集中';
      }
    }

    // ========================================
    // 更新があれば適用
    // ========================================
    if (Object.keys(updates).length > 0) {
      console.log(`📝 更新: ${item.title || item.content.substring(0, 50)}...`);
      console.log(`   現在: ブランド=${item.brands?.name || '未設定'}, コース=${item.course || '未設定'}`);

      if (updates.brandId) {
        const newBrand = brands.find(b => b.id === updates.brandId);
        console.log(`   → ブランド: ${newBrand?.name}`);
      }
      if (updates.course) {
        console.log(`   → コース: ${updates.course}`);
      }

      await prisma.knowledge_items.update({
        where: { id: item.id },
        data: updates,
      });

      updateCount++;
      console.log('');
    }
  }

  console.log(`\n✅ 完了: ${updateCount}件を更新しました`);

  await prisma.$disconnect();
}

main().catch(console.error);
