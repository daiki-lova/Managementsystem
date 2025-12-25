/**
 * 受講生の声インポートスクリプト
 * CSVファイルから65件の受講生の声をナレッジバンクにインポートします
 *
 * 使用方法:
 * cd backend && npx tsx scripts/import-student-voices.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const CSV_PATH = '/Users/daiki/Downloads/シークエンス！受講生の声 - シート1.csv';
const BRAND_NAME = 'シークエンス！';
const BRAND_SLUG = 'sequence';
const KNOWLEDGE_TYPE = '受講生の声';

interface Testimonial {
  index: number;
  content: string;
}

function parseCSV(csvContent: string): Testimonial[] {
  const testimonials: Testimonial[] = [];

  // 各テスティモニアルは "1. なぜRYT200" で始まる
  // CSVは1つのセルに各テスティモニアルの全文が入っている（ダブルクォートで囲まれている）
  const regex = /"1\. なぜRYT200[\s\S]*?(?=\n"1\. なぜRYT200|$)/g;
  const matches = csvContent.match(regex);

  if (!matches) {
    // 別のパターンで試行: クォートなしの場合
    const lines = csvContent.split(/\n(?=1\. なぜRYT200)/);
    lines.forEach((line, index) => {
      if (line.trim()) {
        testimonials.push({
          index: index + 1,
          content: cleanContent(line),
        });
      }
    });
    return testimonials;
  }

  matches.forEach((match, index) => {
    testimonials.push({
      index: index + 1,
      content: cleanContent(match),
    });
  });

  return testimonials;
}

function cleanContent(content: string): string {
  // 先頭と末尾のダブルクォートを削除
  let cleaned = content.replace(/^"/, '').replace(/"$/, '');
  // ダブルクォートのエスケープを解除
  cleaned = cleaned.replace(/""/g, '"');
  // 連続する空行を1つに
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  // 前後の空白をトリム
  cleaned = cleaned.trim();
  return cleaned;
}

async function getOrCreateBrand(): Promise<string> {
  // まず既存のブランドを検索
  let brand = await prisma.brands.findUnique({
    where: { slug: BRAND_SLUG },
  });

  if (brand) {
    console.log(`✓ 既存のブランドを使用: ${brand.name} (${brand.id})`);
    return brand.id;
  }

  // ブランドが存在しない場合は作成
  brand = await prisma.brands.create({
    data: {
      id: randomUUID(),
      name: BRAND_NAME,
      slug: BRAND_SLUG,
      description: 'ヨガインストラクター資格スクール',
    },
  });

  console.log(`✓ 新しいブランドを作成: ${brand.name} (${brand.id})`);
  return brand.id;
}

async function importTestimonials(testimonials: Testimonial[], brandId: string): Promise<void> {
  console.log(`\n${testimonials.length}件のテスティモニアルをインポートします...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const testimonial of testimonials) {
    try {
      await prisma.knowledge_items.create({
        data: {
          id: randomUUID(),
          title: `受講生の声 #${testimonial.index}`,
          type: KNOWLEDGE_TYPE,
          brandId: brandId,
          course: 'RYT200',
          content: testimonial.content,
          usageCount: 0,
        },
      });
      successCount++;
      process.stdout.write(`\r進捗: ${successCount + errorCount}/${testimonials.length} (成功: ${successCount}, 失敗: ${errorCount})`);
    } catch (error) {
      errorCount++;
      console.error(`\n✗ #${testimonial.index} のインポートに失敗:`, error);
    }
  }

  console.log(`\n\n=== インポート完了 ===`);
  console.log(`成功: ${successCount}件`);
  console.log(`失敗: ${errorCount}件`);
}

async function main() {
  console.log('=== 受講生の声インポートスクリプト ===\n');

  try {
    // CSVファイルを読み込み
    console.log(`CSVファイルを読み込み中: ${CSV_PATH}`);
    const csvContent = readFileSync(CSV_PATH, 'utf-8');
    console.log(`✓ ファイル読み込み完了 (${csvContent.length} bytes)\n`);

    // CSVをパース
    console.log('テスティモニアルを解析中...');
    const testimonials = parseCSV(csvContent);
    console.log(`✓ ${testimonials.length}件のテスティモニアルを検出\n`);

    if (testimonials.length === 0) {
      console.error('✗ テスティモニアルが見つかりませんでした');
      process.exit(1);
    }

    // 最初のテスティモニアルをプレビュー
    console.log('--- 最初のテスティモニアル（プレビュー）---');
    console.log(testimonials[0].content.substring(0, 300) + '...\n');

    // ブランドを取得または作成
    console.log('ブランドを確認中...');
    const brandId = await getOrCreateBrand();

    // インポート実行
    await importTestimonials(testimonials, brandId);

  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
