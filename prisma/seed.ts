import { PrismaClient, UserRole, ArticleStatus, ConversionType, ConversionStatus, MediaSource } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

/**
 * 公開サイト用シードデータ (Enhanced)
 * ダッシュボードのグラフ等を動かすためのダミー統計データも含みます
 */
async function main() {
  console.log("🌱 シードデータを投入中...\n");

  // ========================================
  // 1. システム設定
  // ========================================
  await prisma.system_settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      minSearchVolume: 300,
      maxSearchVolume: 2000,
      aiModel: "anthropic/claude-sonnet-4",
    },
  });
  console.log("✓ システム設定");

  // ========================================
  // 2. ブランド
  // ========================================
  const brand = await prisma.brands.upsert({
    where: { slug: "radiance" },
    update: {},
    create: {
      id: randomUUID(),
      name: "RADIANCE",
      slug: "radiance",
      description: "ライフスタイルを豊かにする総合メディア",
      isDefault: true,
    },
  });
  console.log("✓ ブランド");

  // ========================================
  // 3. カテゴリー
  // ========================================
  const categoryData = [
    { name: "YOGA", slug: "yoga", color: "#3B82F6", description: "ヨガポーズ・哲学・実践方法" },
    { name: "PILATES", slug: "pilates", color: "#8B5CF6", description: "ピラティスエクササイズ・体幹トレーニング" },
    { name: "WELLNESS", slug: "wellness", color: "#10B981", description: "健康・ウェルネス・マインドフルネス" },
    { name: "MONEY", slug: "money", color: "#F59E0B", description: "資産運用・節約・マネーリテラシー" },
    { name: "BEAUTY", slug: "beauty", color: "#EC4899", description: "スキンケア・コスメ・美容医療" },
    { name: "CAREER", slug: "career", color: "#6366F1", description: "キャリア・副業・スキルアップ" },
    { name: "LIFE", slug: "life", color: "#14B8A6", description: "ライフスタイル・暮らし・ガジェット" },
  ];

  const categories: Record<string, { id: string; name: string; slug: string }> = {};
  for (const cat of categoryData) {
    const created = await prisma.categories.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: randomUUID(),
        ...cat,
      },
    });
    categories[cat.slug] = created;
  }
  console.log("✓ カテゴリー (7件)");

  // ========================================
  // 4. 監修者 (多様なプロフィール)
  // ========================================
  // ========================================
  // 4. 監修者 (多様なプロフィール + High Quality Yoga Experts)
  // ========================================
  console.log("Seeding Authors...");
  const authorsData = [
    // Existing Authors
    {
      name: "佐藤 健一",
      slug: "kenichi-sato",
      role: "Financial Planner",
      categories: ["MONEY", "CAREER"],
      tags: ["資産運用", "節約"],
      qualifications: ["CFP", "1級FP技能士"],
      bio: "大手金融機関で10年以上の経験を持つファイナンシャルプランナー。資産運用から保険の見直しまで、幅広い相談に対応しています。",
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
      socialLinks: { twitter: "https://twitter.com/kenichi_fp", instagram: "https://instagram.com/kenichi_fp" },
      systemPrompt: "あなたは経験豊富なファイナンシャルプランナーです。正確な金融知識に基づき、初心者にも分かりやすく解説してください。",
    },
    {
      name: "田中 美咲",
      slug: "misaki-tanaka",
      role: "Dermatologist",
      categories: ["BEAUTY", "WELLNESS"],
      tags: ["スキンケア", "美容医療"],
      qualifications: ["皮膚科専門医", "医学博士"],
      bio: "大学病院での勤務を経て、現在は美容皮膚科クリニックの院長を務める。科学的根拠に基づいたスキンケア情報を発信。",
      imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop",
      socialLinks: { instagram: "https://instagram.com/dr_misaki" },
      systemPrompt: "あなたは皮膚科専門医です。医学的エビデンスに基づき、肌の悩みに対する適切なアドバイスを提供してください。",
    },
    {
      name: "鈴木 翔太",
      slug: "shota-suzuki",
      role: "Tech Reviewer",
      categories: ["LIFE", "CAREER"],
      tags: ["ガジェット", "業務効率化"],
      qualifications: ["ITストラテジスト", "元システムエンジニア"],
      bio: "最新ガジェットから業務効率化ツールまで、徹底的な検証レビューに定評があるテック系ライター。",
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      socialLinks: { twitter: "https://twitter.com/shota_tech", youtube: "https://youtube.com/c/shota_tech" },
      systemPrompt: "あなたは辛口テックレビュアーです。メリットだけでなくデメリットも正直に伝え、ユーザーの購買判断に役立つ情報を提供してください。",
    },
    // High Quality Yoga Experts
    {
      name: "Akira先生",
      slug: "akira-pt",
      role: "理学療法士 / ヨガ解剖学講師",
      categories: ["YOGA", "WELLNESS"],
      tags: ["解剖学", "リハビリ", "初心者"],
      qualifications: ["理学療法士(PT)", "全米ヨガアライアンスE-RYT200"],
      bio: "総合病院でのリハビリテーション業務を経て、予防医学としてのヨガに目覚める。「怪我をしない、させない」をモットーに、解剖学に基づいた安全な身体の使い方を指導。",
      imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80",
      socialLinks: {},
      systemPrompt: `あなたは「Akira先生」として記事を執筆します。理学療法士の国家資格を持つ、人体のスペシャリストです。
      
【SEO・LLMO（大規模言語モデル最適化）のための執筆ルール】
1.  **E-E-A-T（経験・専門性・権威性・信頼性）の担保**:
    *   必ず「理学療法士の視点」から、解剖学的根拠（筋肉名、骨格名）を明示してください。
    *   「〜と言われています」ではなく「〜です」と断定できる部分は専門家として断定し、信頼性を高めてください。
2.  **検索意図（Search Intent）の網羅**:
    *   読者がそのキーワードで検索した「真の理由（悩み）」を冒頭で代弁・共感してください。
    *   記事の中盤で、読者が抱くであろう「関連する疑問（People Also Ask）」を先回りして解決してください。
3.  **構造化と可読性**:
    *   **強調スニペット（Featured Snippets）を意識**: 質問に対する「直接的な回答」を、各セクションの冒頭に簡潔（40〜60文字）に記述してください。
    *   箇条書き、番号付きリストを多用し、情報のスキャン性を高めてください。
    *   専門用語を使った直後に、必ず小学生でもわかる比喩表現を入れてください。`,
    },
    {
      name: "Sarah",
      slug: "sarah-mindfulness",
      role: "マインドフルネスコーチ / 心理カウンセラー",
      categories: ["WELLNESS", "YOGA"],
      tags: ["瞑想", "メンタルヘルス", "睡眠"],
      qualifications: ['MBSR認定講師', '産業カウンセラー'],
      bio: "外資系企業での激務で体調を崩した経験から瞑想を実践。現在は企業向けのマインドフルネス研修や、女性向けのメンタルケアワークショップを主宰。",
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      socialLinks: {},
      systemPrompt: `あなたは「Sarah」として記事を執筆します。マインドフルネスのプロフェッショナルです。

【SEO・LLMOのための執筆ルール】
1.  **滞在時間（Dwell Time）の最大化**:
    *   読者を惹きつける「ストーリーテリング」の手法を用いてください。
    *   冒頭で「あなたの今の気持ち、わかります」という強いフックを入れてください。
2.  **NLP（自然言語処理）への最適化**:
    *   感情を表す言葉（辛い、焦り、安らぎ、解放感など）を意図的に散りばめ、文脈的な関連性を高めてください。
    *   抽象的な概念を具体的なエピソードに落とし込んでください。
3.  **アクションの容易性**:
    *   「今すぐその場でできること」を必ず提案してください（例：今すぐ深呼吸を一回する）。`,
    },
    {
      name: "Kenji",
      slug: "kenji-ayurveda",
      role: "アーユルヴェーダ・ライフスタイリスト",
      categories: ["WELLNESS", "BEAUTY"],
      tags: ["アーユルヴェーダ", "食事法", "デトックス"],
      qualifications: ['アーユルヴェーダ・ライフスタイルカウンセラー'],
      bio: "インド・ケララ州での修行を経て、日本の気候風土に合わせたアーユルヴェーダ的ライフスタイルを提案。食事、睡眠、入浴法など、生活全般のアドバイスを行う。",
      imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      socialLinks: {},
      systemPrompt: `あなたは「Kenji」として記事を執筆します。アーユルヴェーダとホリスティックヘルスの権威です。

【SEO・LLMOのための執筆ルール】
1.  **網羅性と深度（Depth of Content）**:
    *   表面的な解説だけでなく、歴史的背景や哲学的な意味合いまで踏み込んでください。
    *   関連するサジェストキーワード（食事、時間帯、季節、体質など）を自然に文中に盛り込んでください。
2.  **独自性（Originality）**:
    *   「現代の日本生活にどう適用するか」という独自の視点を提供してください。
    *   「ドーシャ診断」のような、インタラクティブ性を感じさせる要素（チェックリストなど）を含めてください。
3.  **構造的SEO**:
    *   各見出し（H2, H3）には必ずキーワードを含めてください。`,
    },
  ];

  const authors: Record<string, { id: string; name: string }> = {};
  for (const author of authorsData) {
    const created = await prisma.authors.upsert({
      where: { slug: author.slug },
      update: {
        categories: author.categories, // Also update existing
        tags: author.tags
      },
      create: {
        id: randomUUID(),
        name: author.name,
        slug: author.slug,
        role: author.role,
        qualifications: author.qualifications,
        bio: author.bio,
        imageUrl: author.imageUrl,
        socialLinks: author.socialLinks,
        systemPrompt: author.systemPrompt,
        categories: author.categories,
        tags: author.tags,
      },
    });
    authors[author.slug] = created;
  }
  console.log("✓ 監修者 (6件)");

  // ========================================
  // 5. メディア（画像）
  // ========================================
  const imageUrls = [
    // Yoga/Wellnes
    "https://images.unsplash.com/photo-1610562269919-86791081ad29?fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1591258370814-01609b341790?fit=crop&w=1080&q=80",
    // Fitness
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?fit=crop&w=1080&q=80",
    // Money/Office
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?fit=crop&w=1080&q=80", // Piggy bank
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?fit=crop&w=1080&q=80", // Calc/charts
    // Beauty
    "https://images.unsplash.com/photo-1596462502278-27bfdd403348?fit=crop&w=1080&q=80", // Cosmetics
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?fit=crop&w=1080&q=80", // Skin cream
    // Gadget/Work
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?fit=crop&w=1080&q=80", // Laptop
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?fit=crop&w=1080&q=80", // Team working
  ];
  // Generate 20 assets reusing URLs cyclically
  const mediaAssets: string[] = [];
  for (let i = 0; i < 20; i++) {
    const mediaId = `media-${i + 1}`;
    const url = imageUrls[i % imageUrls.length];
    await prisma.media_assets.upsert({
      where: { id: mediaId },
      update: {},
      create: {
        id: mediaId,
        fileName: `image-${i + 1}.jpg`,
        url: url,
        fileSize: 150000,
        width: 1080,
        height: 720,
        altText: `サンプル画像 ${i + 1}`,
        source: MediaSource.UPLOAD, // Fixed: EXTERNAL -> UPLOAD
        showInLibrary: true,
      },
    });
    mediaAssets.push(mediaId);
  }
  console.log("✓ メディア (20件)");

  // ========================================
  // 6. コンバージョン
  // ========================================
  const conversionData = [
    {
      id: "cv-trial",
      name: "無料体験レッスン",
      type: ConversionType.BANNER,
      status: ConversionStatus.ACTIVE,
      url: "https://example.com/trial",
      context: "初めての方限定、無料体験レッスンを実施中！",
    },
    {
      id: "cv-consultation",
      name: "無料資産運用相談",
      type: ConversionType.TEXT,
      status: ConversionStatus.ACTIVE,
      url: "https://example.com/consult",
      context: "プロに相談して将来の不安を解消しませんか？",
    },
    {
      id: "cv-line-official",
      name: "【無料】公式LINE登録",
      type: ConversionType.BANNER,
      status: ConversionStatus.ACTIVE,
      url: "https://line.me/R/ti/p/@radiance_yoga",
      context: `もっと気軽な情報を届けたいときのオファー。
【内容】
- 毎朝8時に「今日のポジティブメッセージ」が届く
- 限定のショート動画（1分ヨガ）が見られる
- 悩み相談ができる
【訴求】
- 「まずは情報だけ欲しい」というライト層向け
- 「友達追加するだけでOK」という手軽さ`,
    }
  ];

  for (const cv of conversionData) {
    await prisma.conversions.upsert({
      where: { id: cv.id },
      update: {},
      create: cv,
    });
  }
  console.log("✓ コンバージョン (3件)");

  // ========================================
  // 6.5 情報バンク (Knowledge Items) - High Quality
  // ========================================
  const knowledgeData = [
    // Customer Voices
    {
      title: 'お客様の声：30代女性・デスクワーク',
      type: 'voice',
      content: `「万年の肩こりと頭痛に悩んでいましたが、Radiance Yogaの『肩甲骨はがし』動画を毎晩寝る前にやるようになってから、嘘のように楽になりました。薬を飲む回数が激減して本当に感謝しています！」（会員歴6ヶ月・東京都・A.K様）`
    },
    {
      title: 'お客様の声：40代男性・管理職',
      type: 'voice',
      content: `「仕事のプレッシャーで夜眠れない日が続いていましたが、Akira先生の『自律神経を整える呼吸法』を試したところ、朝までぐっすり眠れるようになりました。今では部下にも勧めています。」（会員歴1年・大阪府・T.S様）`
    },
    // Scientific/Technical Info
    {
      title: 'ヨガと睡眠の質の関係（研究データ）',
      type: 'fact',
      content: `ジョンズ・ホプキンス大学の研究レビューによると、就寝前の穏やかなヨガは、不眠症の改善において睡眠薬と同等の効果をもたらす可能性があるとされています。特に脚の裏側を伸ばすストレッチや、前屈のポーズは副交感神経を刺激し、深部体温を下げるのを助けるため、入眠をスムーズにします。`
    },
    {
      title: 'Radiance Yoga ライティングガイドライン（SEO版）',
      type: 'guideline',
      content: '記事作成時のルール：1. PREP法（結論→理由→具体例→結論）を基本とする。 2. 一文は読点を含めて60文字以内を目安にする。 3. 専門用語は必ず補足する（例：「アーサナ（ポーズ）」）。 4. 読者が自分事として捉えられるよう「あなた」という二人称を多用する。'
    }
  ];

  for (const item of knowledgeData) {
    const existing = await prisma.knowledge_items.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.knowledge_items.create({
        data: {
          id: randomUUID(),
          title: item.title,
          type: item.type,
          content: item.content,
          sourceUrl: 'Internal Data'
        }
      });
    }
  }
  console.log("✓ 情報バンク (4件+)");

  // ========================================
  // 7. タグ
  // ========================================
  const tagData = [
    { name: "初心者向け", slug: "beginner" },
    { name: "上級者向け", slug: "advanced" },
    { name: "NISA", slug: "nisa" },
    { name: "投資信託", slug: "investment-trust" },
    { name: "エイジングケア", slug: "aging-care" },
    { name: "時短", slug: "time-saving" },
    { name: "レビュー", slug: "review" },
    { name: "MacBook", slug: "macbook" },
    { name: "副業", slug: "side-hustle" },
  ];

  const tags: Record<string, string> = {};
  for (const tag of tagData) {
    const created = await prisma.tags.upsert({
      where: { slug: tag.slug },
      update: {},
      create: {
        id: randomUUID(),
        ...tag,
      },
    });
    tags[tag.slug] = created.id;
  }
  console.log("✓ タグ");

  // ========================================
  // 8. ユーザー
  // ========================================
  const adminUser = await prisma.users.upsert({
    where: { email: "admin@radiance.jp" },
    update: {},
    create: {
      id: randomUUID(),
      email: "admin@radiance.jp",
      password: "placeholder",
      role: UserRole.OWNER,
      name: "管理者",
    },
  });
  console.log("✓ ユーザー");

  // ========================================
  // 9. 記事 (多様なサンプル)
  // ========================================
  const articlesData = [
    // --- YOGA / PILATES ---
    {
      title: "心と体を整える──ヨガ＆ピラティスで理想のライフスタイルを手に入れる",
      slug: "yoga-pilates-lifestyle",
      categorySlug: "yoga",
      authorId: "misaki-tanaka", // Replaced: author-yuki-tanaka -> misaki-tanaka (closest female profile)
      thumbnailIndex: 0,
      tagSlugs: ["beginner"],
      status: ArticleStatus.PUBLISHED,
    },
    // --- MONEY ---
    {
      title: "新NISAで始める資産形成！初心者が知っておくべき3つの鉄則",
      slug: "new-nisa-basics",
      categorySlug: "money",
      authorId: "kenichi-sato", // Replaced: author-kenji-sato -> kenichi-sato
      thumbnailIndex: 3,
      tagSlugs: ["nisa", "beginner", "investment-trust"],
      status: ArticleStatus.PUBLISHED,
    },
    {
      title: "老後2000万円問題は本当？FPが教える現実的な対策シミュレーション",
      slug: "retirement-20m-simulation",
      categorySlug: "money",
      authorId: "kenichi-sato", // Replaced
      thumbnailIndex: 4,
      tagSlugs: ["advanced"],
      status: ArticleStatus.PUBLISHED,
    },
    // --- BEAUTY ---
    {
      title: "「保湿したのに乾燥する」はなぜ？皮膚科医が教える正しいスキンケア手順",
      slug: "dermatologist-skincare-routine",
      categorySlug: "beauty",
      authorId: "author-dr-mika",
      thumbnailIndex: 5,
      tagSlugs: ["aging-care", "beginner"],
      status: ArticleStatus.PUBLISHED,
    },
    {
      title: "成分から選ぶ！30代から始めるべきレチノール美容液5選",
      slug: "best-retinol-serums-30s",
      categorySlug: "beauty",
      authorId: "author-dr-mika",
      thumbnailIndex: 6,
      tagSlugs: ["aging-care", "review"],
      status: ArticleStatus.PUBLISHED,
    },
    // --- LIFE / GADGET ---
    {
      title: "M3 MacBook Air 実機レビュー：Air史上最高だが、プロには物足りない？",
      slug: "m3-macbook-air-review",
      categorySlug: "life",
      authorId: "shota-suzuki", // Replaced: author-tech-guru -> shota-suzuki
      thumbnailIndex: 7,
      tagSlugs: ["macbook", "review"],
      status: ArticleStatus.PUBLISHED,
    },
    {
      title: "リモートワークが捗るデスク環境構築術2024",
      slug: "remote-work-desk-setup-2024",
      categorySlug: "life",
      authorId: "shota-suzuki", // Replaced: author-tech-guru -> shota-suzuki
      thumbnailIndex: 8,
      tagSlugs: ["time-saving", "side-hustle"],
      status: ArticleStatus.DRAFT,
    },
    // --- CAREER ---
    {
      title: "【未経験OK】週末副業で月5万円稼ぐためのロードマップ",
      slug: "side-hustle-roadmap-50k",
      categorySlug: "career",
      authorId: "misaki-tanaka", // Replaced: author-radiance-team -> misaki-tanaka (fallback)
      thumbnailIndex: 2,
      tagSlugs: ["side-hustle", "beginner"],
      status: ArticleStatus.SCHEDULED,
    },
  ];

  const genericBlocks = [
    { id: "block-1", type: "p", content: "このテーマについて、専門的な視点から詳しく解説していきます。まずは基本を押さえましょう。" },
    { id: "block-2", type: "h2", content: "重要なポイントとは？" },
    { id: "block-3", type: "p", content: "多くの人が見落としがちなのが、継続することの難しさです。しかし、正しい知識があれば習慣化は難しくありません。" },
    { id: "block-4", type: "h2", content: "具体的な実践方法" },
    { id: "block-5", type: "p", content: "ステップバイステップで見ていきましょう。\n1. 目標を明確にする\n2. 小さな一歩から始める\n3. 記録をつける" },
    { id: "block-6", type: "h2", content: "まとめ" },
    { id: "block-7", type: "p", content: "今回の情報が少しでもお役に立てば幸いです。ぜひ今日から実践してみてください。" },
  ];

  // Store created article IDs for analytics generation
  const createdArticleIds: string[] = [];

  for (const article of articlesData) {
    const articleId = randomUUID();
    const category = categories[article.categorySlug];

    // Determine publishedAt based on status
    let publishedAt = null;
    if (article.status === ArticleStatus.PUBLISHED) {
      publishedAt = new Date();
    } else if (article.status === ArticleStatus.SCHEDULED) {
      publishedAt = new Date(Date.now() + 86400000 * 3); // 3 days later
    }

    // 記事作成
    const createdArticle = await prisma.articles.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        id: articleId,
        title: article.title,
        slug: article.slug,
        blocks: genericBlocks,
        status: article.status,
        publishedAt: publishedAt,
        // scheduledAt: removed as it does not exist
        metaTitle: article.title,
        metaDescription: `${article.title}についての詳細記事です。`,
        categoryId: category.id,
        authorId: authors[article.authorId]?.id || authors[Object.keys(authors)[0]].id, // Lookup UUID by slug, fallback to first author if missing
        brandId: brand.id,
        thumbnailId: mediaAssets[article.thumbnailIndex],
        createdById: adminUser.id,
      },
    });
    createdArticleIds.push(createdArticle.id);

    // タグを紐づけ
    for (const tagSlug of article.tagSlugs) {
      const tagId = tags[tagSlug];
      if (tagId) {
        await prisma.article_tags.upsert({
          where: { articleId_tagId: { articleId: createdArticle.id, tagId } }, // Fixed: articleId -> createdArticle.id
          update: {},
          create: { articleId: createdArticle.id, tagId }, // Fixed: articleId -> createdArticle.id
        });
      }
    }
  }

  // カテゴリの記事数を更新
  for (const slug of Object.keys(categories)) {
    const count = await prisma.articles.count({
      where: { categoryId: categories[slug].id, status: ArticleStatus.PUBLISHED },
    });
    await prisma.categories.update({
      where: { id: categories[slug].id },
      data: { articlesCount: count },
    });
  }
  console.log(`✓ 記事 (${articlesData.length}件)`);

  // ========================================
  // 10. アクセス解析データ (Dummy Analytics)
  // ========================================
  // 過去30日分、公開済み記事に対してデータを生成
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - i)); // 29日前から今日まで

    for (const articleId of createdArticleIds) {
      // 記事データを取得して公開状態かチェック（簡易的に全記事ループでもよいが、公開記事だけに入れるのが自然）
      // 今回は作成した全記事に入れてしまう（ドラフトにPVがあってもおかしいが、モックなので許容）
      // 実際はStatusチェックすべきだが、簡易実装としてランダムパラメーターでバリエーションを出す

      // 基本乱数
      const baseRandom = Math.random();
      // 週末(0:Sun, 6:Sat)は少し多めにするロジック
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const weekendMultiplier = isWeekend ? 1.3 : 1.0;

      // トレンド係数（後半にかけて伸びる）
      const trendMultiplier = 1 + (i / 30) * 0.5;

      // Realistic small site numbers: 0-5 PV per article per day
      const pv = Math.floor(Math.random() * 5 * weekendMultiplier * trendMultiplier);
      const users = Math.max(0, Math.floor(pv * (0.8 + Math.random() * 0.2))); // PVの80-100% (High new user rate)
      const sessions = Math.max(users, Math.floor(pv * (0.9 + Math.random() * 0.1))); // Sessions >= Users

      await prisma.analytics_data.upsert({
        where: {
          articleId_date: {
            articleId,
            date
          }
        },
        update: {},
        create: {
          id: randomUUID(),
          articleId,
          date,
          pageViews: pv,
          organicViews: Math.floor(pv * 0.5),
          conversionClicks: Math.floor(pv * 0.05),
          bounceRate: Math.floor(40 + Math.random() * 30), // 40-70%
          avgTimeOnPage: 60 + Math.random() * 120, // 60-180 seconds
        }
      });
    }
  }
  console.log("✓ アクセス解析データ (30日分)");

  console.log("\n✅ シードデータの投入が完了しました！");
}

main()
  .catch((e) => {
    console.error("❌ シードデータ投入エラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
