import { PrismaClient, UserRole, ArticleStatus, ConversionType, ConversionStatus, KnowledgeType } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * E2Eテスト用シードデータ
 * テスト実行前にこのスクリプトでデータを投入
 */
async function main() {
  console.log("🧪 E2Eテスト用シードデータを投入中...\n");

  // ========================================
  // 1. システム設定
  // ========================================
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      minSearchVolume: 300,
      maxSearchVolume: 2000,
      aiModel: "openai/gpt-4-turbo",
    },
  });
  console.log("✓ システム設定");

  // ========================================
  // 2. ブランド
  // ========================================
  const brand = await prisma.brand.upsert({
    where: { slug: "e2e-brand" },
    update: {},
    create: {
      name: "E2Eテストブランド",
      slug: "e2e-brand",
      description: "E2Eテスト用のブランドです",
      isDefault: true,
    },
  });
  console.log("✓ ブランド");

  // ========================================
  // 3. カテゴリー (4件)
  // ========================================
  const categories = [
    { name: "ヨガポーズ", slug: "yoga-poses", color: "#3B82F6", description: "基本から応用までのヨガポーズを紹介" },
    { name: "ヨガ哲学", slug: "yoga-philosophy", color: "#8B5CF6", description: "ヨガの思想と哲学を深く解説" },
    { name: "健康・ウェルネス", slug: "health-wellness", color: "#10B981", description: "心身の健康に関する情報" },
    { name: "瞑想・マインドフルネス", slug: "meditation", color: "#F59E0B", description: "瞑想とマインドフルネスの実践方法" },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(created);
  }
  console.log("✓ カテゴリー (4件)");

  // ========================================
  // 4. 監修者 (2件)
  // ========================================
  const authors = [
    {
      id: "e2e-author-1",
      name: "山田花子",
      role: "ヨガインストラクター",
      qualifications: ["RYT200", "全米ヨガアライアンス認定"],
      bio: "ヨガ歴15年。初心者から上級者まで幅広く指導。",
      systemPrompt: "あなたは経験豊富なヨガインストラクターです。安全面を重視した指導を行います。",
      imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    },
    {
      id: "e2e-author-2",
      name: "田中太郎",
      role: "ピラティスインストラクター",
      qualifications: ["RYT500", "マットピラティス認定"],
      bio: "ピラティス・ヨガ両方の資格を持つ指導者。",
      systemPrompt: "あなたはピラティスとヨガの専門家です。身体の使い方を丁寧に説明します。",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    },
  ];

  const createdAuthors = [];
  for (const author of authors) {
    const created = await prisma.author.upsert({
      where: { id: author.id },
      update: {},
      create: author,
    });
    createdAuthors.push(created);
  }
  console.log("✓ 監修者 (2件)");

  // ========================================
  // 5. コンバージョン (2件)
  // ========================================
  const conversions = [
    {
      id: "e2e-cv-1",
      name: "無料体験キャンペーン",
      type: ConversionType.CAMPAIGN,
      status: ConversionStatus.ACTIVE,
      url: "https://example.com/trial",
      context: "初めての方限定、無料体験レッスンを実施中！",
    },
    {
      id: "e2e-cv-2",
      name: "RYT200取得講座",
      type: ConversionType.PERMANENT,
      status: ConversionStatus.ACTIVE,
      url: "https://example.com/ryt200",
      context: "ヨガインストラクター資格取得を目指す方へ",
    },
  ];

  const createdConversions = [];
  for (const cv of conversions) {
    const created = await prisma.conversion.upsert({
      where: { id: cv.id },
      update: {},
      create: cv,
    });
    createdConversions.push(created);
  }
  console.log("✓ コンバージョン (2件)");

  // ========================================
  // 6. タグ (5件)
  // ========================================
  const tags = [
    { name: "初心者向け", slug: "beginner" },
    { name: "上級者向け", slug: "advanced" },
    { name: "朝ヨガ", slug: "morning-yoga" },
    { name: "リラックス", slug: "relax" },
    { name: "ダイエット", slug: "diet" },
  ];

  const createdTags = [];
  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
    createdTags.push(created);
  }
  console.log("✓ タグ (5件)");

  // ========================================
  // 7. メディア (5件)
  // ========================================
  const mediaItems = [
    {
      id: "e2e-media-1",
      fileName: "yoga-pose-1.jpg",
      url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
      mimeType: "image/jpeg",
      fileSize: 150000,
      width: 800,
      height: 600,
      altText: "ヨガポーズの女性",
      showInLibrary: true,
    },
    {
      id: "e2e-media-2",
      fileName: "meditation.jpg",
      url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      mimeType: "image/jpeg",
      fileSize: 120000,
      width: 800,
      height: 600,
      altText: "瞑想する人",
      showInLibrary: true,
    },
    {
      id: "e2e-media-3",
      fileName: "wellness.jpg",
      url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
      mimeType: "image/jpeg",
      fileSize: 180000,
      width: 800,
      height: 600,
      altText: "ウェルネスイメージ",
      showInLibrary: true,
    },
    {
      id: "e2e-media-4",
      fileName: "studio.jpg",
      url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
      mimeType: "image/jpeg",
      fileSize: 200000,
      width: 800,
      height: 600,
      altText: "ヨガスタジオ",
      showInLibrary: true,
    },
    {
      id: "e2e-media-5",
      fileName: "healthy-food.jpg",
      url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
      mimeType: "image/jpeg",
      fileSize: 160000,
      width: 800,
      height: 600,
      altText: "健康的な食事",
      showInLibrary: true,
    },
  ];

  const createdMedia = [];
  for (const media of mediaItems) {
    const created = await prisma.media.upsert({
      where: { id: media.id },
      update: {},
      create: media,
    });
    createdMedia.push(created);
  }
  console.log("✓ メディア (5件)");

  // ========================================
  // 8. 記事 (カテゴリ毎に5件 = 計20件)
  // ========================================
  const statuses = [
    ArticleStatus.DRAFT,
    ArticleStatus.REVIEW,
    ArticleStatus.PUBLISHED,
    ArticleStatus.PUBLISHED,
    ArticleStatus.PUBLISHED,
  ];

  const sampleBlocks = [
    { id: "block-1", type: "h2", content: "はじめに" },
    { id: "block-2", type: "p", content: "この記事では、ヨガの基本について解説します。初心者の方でも安心して始められるよう、丁寧に説明していきます。" },
    { id: "block-3", type: "h2", content: "基本のポーズ" },
    { id: "block-4", type: "p", content: "まずは基本のポーズから始めましょう。呼吸を意識しながら、ゆっくりと体を動かしていきます。" },
    { id: "block-5", type: "ul", items: ["深い呼吸を心がける", "無理のない範囲で行う", "毎日続けることが大切"] },
    { id: "block-6", type: "h2", content: "まとめ" },
    { id: "block-7", type: "p", content: "継続は力なり。毎日少しずつでも続けることで、確実に効果を実感できるでしょう。" },
  ];

  let articleCount = 0;
  for (const category of createdCategories) {
    for (let i = 0; i < 5; i++) {
      const status = statuses[i];
      const articleId = `e2e-article-${category.slug}-${i + 1}`;
      const slug = `${category.slug}-article-${i + 1}`;

      await prisma.article.upsert({
        where: { id: articleId },
        update: {},
        create: {
          id: articleId,
          title: `【${category.name}】テスト記事${i + 1}`,
          slug: slug,
          blocks: sampleBlocks,
          status: status,
          publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null,
          metaTitle: `${category.name}のテスト記事${i + 1} | RADIANCE`,
          metaDescription: `${category.name}に関するテスト記事です。E2Eテスト用のサンプルコンテンツ。`,
          categoryId: category.id,
          authorId: createdAuthors[i % 2].id,
          brandId: brand.id,
          thumbnailId: createdMedia[i % 5].id,
          tags: {
            connect: [
              { id: createdTags[i % 5].id },
              { id: createdTags[(i + 1) % 5].id },
            ],
          },
          conversions: {
            connect: [{ id: createdConversions[i % 2].id }],
          },
        },
      });
      articleCount++;
    }
  }

  // カテゴリの記事数を更新
  for (const category of createdCategories) {
    const count = await prisma.article.count({
      where: { categoryId: category.id, status: ArticleStatus.PUBLISHED },
    });
    await prisma.category.update({
      where: { id: category.id },
      data: { articlesCount: count },
    });
  }
  console.log(`✓ 記事 (${articleCount}件)`);

  // ========================================
  // 9. 情報バンク (5件)
  // ========================================
  const knowledgeItems = [
    {
      id: "e2e-kb-1",
      title: "生徒の声: ヨガで人生が変わった",
      type: KnowledgeType.STUDENT_VOICE,
      content: "ヨガを始めてから、心身ともに健康になりました。毎朝のヨガが日課になっています。",
      brandId: brand.id,
      authorId: createdAuthors[0].id,
    },
    {
      id: "e2e-kb-2",
      title: "生徒の声: 肩こりが解消",
      type: KnowledgeType.STUDENT_VOICE,
      content: "デスクワークで慢性的だった肩こりが、ヨガを続けることで改善しました。",
      brandId: brand.id,
      authorId: createdAuthors[0].id,
    },
    {
      id: "e2e-kb-3",
      title: "監修者コラム: 正しい呼吸法",
      type: KnowledgeType.AUTHOR_ARTICLE,
      content: "ヨガにおいて呼吸は非常に重要です。腹式呼吸を意識することで、より深いリラックス効果が得られます。",
      brandId: brand.id,
      authorId: createdAuthors[0].id,
    },
    {
      id: "e2e-kb-4",
      title: "監修者コラム: ヨガと瞑想の関係",
      type: KnowledgeType.AUTHOR_ARTICLE,
      content: "ヨガと瞑想は切っても切れない関係にあります。両方を組み合わせることで、より高い効果を得られます。",
      brandId: brand.id,
      authorId: createdAuthors[1].id,
    },
    {
      id: "e2e-kb-5",
      title: "外部記事: ヨガの科学的効果",
      type: KnowledgeType.EXTERNAL,
      content: "最新の研究によると、ヨガは自律神経のバランスを整え、ストレスホルモンを低下させる効果があることが分かっています。",
      sourceUrl: "https://example.com/yoga-science",
      brandId: brand.id,
    },
  ];

  for (const item of knowledgeItems) {
    await prisma.knowledgeItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }
  console.log("✓ 情報バンク (5件)");

  // ========================================
  // 10. SlugHistory (リダイレクト検証用)
  // ========================================
  const firstArticle = await prisma.article.findFirst({
    where: { slug: "yoga-poses-article-1" },
  });

  if (firstArticle) {
    await prisma.slugHistory.upsert({
      where: {
        articleId_oldSlug: {
          articleId: firstArticle.id,
          oldSlug: "old-yoga-article-slug",
        },
      },
      update: {},
      create: {
        articleId: firstArticle.id,
        oldSlug: "old-yoga-article-slug",
      },
    });
    console.log("✓ SlugHistory (リダイレクト検証用)");
  }

  // ========================================
  // 11. テストユーザー
  // ========================================
  await prisma.user.upsert({
    where: { email: "e2e-owner@example.com" },
    update: {},
    create: {
      email: "e2e-owner@example.com",
      password: "placeholder",
      role: UserRole.OWNER,
      name: "E2Eテストオーナー",
    },
  });

  await prisma.user.upsert({
    where: { email: "e2e-editor@example.com" },
    update: {},
    create: {
      email: "e2e-editor@example.com",
      password: "placeholder",
      role: UserRole.EDITOR,
      name: "E2Eテストエディター",
    },
  });
  console.log("✓ テストユーザー (2件)");

  console.log("\n✅ E2Eテスト用シードデータの投入が完了しました！");
  console.log("\n📊 データサマリー:");
  console.log("   - カテゴリー: 4件");
  console.log("   - 監修者: 2件");
  console.log("   - コンバージョン: 2件");
  console.log("   - タグ: 5件");
  console.log("   - メディア: 5件");
  console.log("   - 記事: 20件 (各カテゴリ5件)");
  console.log("   - 情報バンク: 5件");
  console.log("   - ユーザー: 2件 (Owner, Editor)");
}

main()
  .catch((e) => {
    console.error("❌ シードデータ投入エラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
