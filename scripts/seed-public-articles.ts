import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const DEFAULT_BRAND_ID = 'cmiy775yi0000ta6a7nlbt3ib'
const DEFAULT_USER_ID = 'cmiy776cp0005ta6ars8qhdag'

const SAMPLE_ARTICLES = [
  {
    title: '初心者のための太陽礼拝ガイド：基本の12ポーズをマスターしよう',
    slug: 'sun-salutation-guide-for-beginners',
    categorySlug: 'yoga-poses',
    blocks: [
      { type: 'p', content: '太陽礼拝（スーリヤナマスカーラ）は、ヨガの基本的なシーケンスで、12のポーズを連続して行う流れるような動作です。毎日の練習に最適で、心身の目覚めを促します。' },
      { type: 'h2', content: '太陽礼拝の効果' },
      { type: 'p', content: '太陽礼拝を継続することで、柔軟性の向上、筋力強化、心肺機能の改善、ストレス軽減など多くの効果が期待できます。また、一日の始まりに行うことで、エネルギーを高め、集中力を向上させる効果もあります。' },
      { type: 'h2', content: '基本の12ポーズ' },
      { type: 'p', content: '1. 山のポーズ（タダーサナ）から始まり、2. 上向き礼拝、3. 前屈、4. 半前屈、5. プランク、6. 八点のポーズ、7. コブラ、8. 下向きの犬、9. 半前屈、10. 前屈、11. 上向き礼拝、12. 山のポーズへと戻ります。' },
      { type: 'h2', content: '初心者へのアドバイス' },
      { type: 'p', content: '無理をせず、自分のペースで練習しましょう。呼吸と動きを連動させることが大切です。毎朝5分から始めて、徐々に回数を増やしていくことをお勧めします。' }
    ],
    metaTitle: '太陽礼拝の完全ガイド | 初心者向けヨガポーズ解説',
    metaDescription: '太陽礼拝（スーリヤナマスカーラ）の12ポーズを初心者向けに解説。正しいやり方、効果、注意点まで詳しく紹介します。',
  },
  {
    title: 'マインドフルネス瞑想入門：今この瞬間に意識を向ける練習',
    slug: 'introduction-to-mindfulness-meditation',
    categorySlug: 'meditation',
    blocks: [
      { type: 'p', content: 'マインドフルネスとは、今この瞬間に注意を向け、判断せずに観察することです。この実践は、ストレス軽減や精神的な健康に大きな効果があることが科学的に証明されています。' },
      { type: 'h2', content: 'マインドフルネス瞑想の始め方' },
      { type: 'p', content: '静かな場所で楽な姿勢で座ります。目を閉じて、呼吸に意識を向けましょう。息を吸うとき、吐くときの感覚を観察します。思考が浮かんできても、それを判断せず、そっと呼吸に意識を戻します。' },
      { type: 'h2', content: '日常生活でのマインドフルネス' },
      { type: 'p', content: '瞑想だけでなく、食事、歩行、家事など日常のあらゆる活動にマインドフルネスを取り入れることができます。今していることに完全に意識を向けることで、より豊かな体験ができます。' }
    ],
    metaTitle: 'マインドフルネス瞑想入門ガイド | 今この瞬間を生きる',
    metaDescription: 'マインドフルネス瞑想の基本的な方法と効果を解説。初心者でも簡単に始められる瞑想のやり方を紹介します。',
  },
  {
    title: 'ヨガ哲学の基礎：八支則（アシュタンガ）を理解する',
    slug: 'understanding-eight-limbs-of-yoga',
    categorySlug: 'yoga-philosophy',
    blocks: [
      { type: 'p', content: 'ヨガは単なる身体運動ではなく、心身の統合を目指す哲学体系です。パタンジャリが編纂した「ヨーガ・スートラ」には、八支則（アシュタンガ）として知られる8つの実践が説かれています。' },
      { type: 'h2', content: '八支則の概要' },
      { type: 'p', content: '1. ヤマ（禁戒）- 社会的規範 2. ニヤマ（勧戒）- 個人的規範 3. アーサナ（坐法）- ポーズの練習 4. プラーナーヤーマ（調気法）- 呼吸法 5. プラティヤーハーラ（制感）- 感覚の制御 6. ダーラナ（凝念）- 集中 7. ディヤーナ（静慮）- 瞑想 8. サマーディ（三昧）- 悟り' },
      { type: 'h2', content: '現代生活への応用' },
      { type: 'p', content: 'これらの教えは古代のものですが、現代の忙しい生活にも十分に活かすことができます。日々の行動に意識を向け、自己成長の道として実践してみましょう。' }
    ],
    metaTitle: 'ヨガ哲学入門：八支則を学ぶ | RADIANCE',
    metaDescription: 'ヨガの八支則（アシュタンガ）を分かりやすく解説。ヨーガ・スートラの教えを現代生活に活かす方法を紹介します。',
  },
  {
    title: '朝ヨガの効果と簡単にできる5つのポーズ',
    slug: 'morning-yoga-benefits-and-poses',
    categorySlug: 'yoga-poses',
    blocks: [
      { type: 'p', content: '朝ヨガは一日を最高の状態でスタートするための素晴らしい習慣です。たった10分の練習で、心身が目覚め、一日中エネルギッシュに過ごすことができます。' },
      { type: 'h2', content: '朝ヨガの効果' },
      { type: 'p', content: '代謝を上げ、血行を促進し、集中力を高めます。また、朝の練習は習慣化しやすく、継続しやすいというメリットもあります。' },
      { type: 'h2', content: 'おすすめの5ポーズ' },
      { type: 'p', content: '1. 猫牛のポーズ（背骨を目覚めさせる）2. 下向きの犬（全身ストレッチ）3. 戦士のポーズ1（足の強化）4. 三角のポーズ（側面ストレッチ）5. ハッピーベイビー（股関節を開く）' }
    ],
    metaTitle: '朝ヨガの効果とおすすめポーズ5選 | RADIANCE',
    metaDescription: '朝ヨガの効果と初心者でも簡単にできる5つのポーズを紹介。毎朝10分で一日を爽やかにスタートしましょう。',
  },
  {
    title: 'ヨガと健康：免疫力を高める呼吸法の実践',
    slug: 'yoga-breathing-for-immunity',
    categorySlug: 'health-wellness',
    blocks: [
      { type: 'p', content: 'ヨガの呼吸法（プラーナーヤーマ）は、単なる深呼吸以上のものです。科学的研究により、特定の呼吸法が免疫系を活性化し、ストレスホルモンを減少させることが示されています。' },
      { type: 'h2', content: '免疫力を高める呼吸法' },
      { type: 'p', content: 'カパーラバーティ（頭蓋光明法）は、素早く力強い呼気を繰り返す呼吸法で、毒素の排出を促進します。ナディ・ショーダナ（交互鼻孔呼吸）は、神経系のバランスを整え、免疫機能を最適化します。' },
      { type: 'h2', content: '実践のポイント' },
      { type: 'p', content: '朝の空腹時に行うのが最も効果的です。無理をせず、自分のペースで練習しましょう。継続することで、風邪を引きにくくなったり、疲れにくくなったりする効果を実感できます。' }
    ],
    metaTitle: 'ヨガ呼吸法で免疫力アップ | 健康のためのプラーナーヤーマ',
    metaDescription: 'ヨガの呼吸法（プラーナーヤーマ）で免疫力を高める方法を解説。科学的根拠に基づいた実践方法を紹介します。',
  },
  {
    title: '夜の瞑想習慣：質の高い睡眠を得るための実践法',
    slug: 'evening-meditation-for-better-sleep',
    categorySlug: 'meditation',
    blocks: [
      { type: 'p', content: '現代人の多くが睡眠の質に悩んでいます。夜の瞑想は、一日のストレスを解放し、心身をリラックスさせ、深い眠りへと導きます。' },
      { type: 'h2', content: 'ボディスキャン瞑想' },
      { type: 'p', content: '仰向けに横になり、足先から頭頂部まで、ゆっくりと意識を移動させます。各部位の緊張を認識し、息を吐きながら解放していきます。この練習を10-15分行うだけで、睡眠の質が大きく改善されます。' },
      { type: 'h2', content: '就寝前の習慣' },
      { type: 'p', content: '瞑想の30分前からスマートフォンを手放し、照明を暗くします。軽いストレッチの後、瞑想を行い、そのまま眠りにつくのが理想的です。' }
    ],
    metaTitle: '夜の瞑想で睡眠の質を改善 | リラックス瞑想法',
    metaDescription: '睡眠の質を高める夜の瞑想法を紹介。ボディスキャン瞑想のやり方と就寝前のリラックス習慣を解説します。',
  },
]

async function main() {
  // 著者を更新
  await prisma.authors.update({
    where: { id: 'default-author' },
    data: {
      name: '田中美穂',
      role: 'シニアヨガインストラクター',
      bio: '全米ヨガアライアンスRYT500認定インストラクター。10年以上のヨガ指導経験を持ち、ヨガ哲学と現代的なアプローチを融合させた指導で人気を集める。瞑想やマインドフルネスの講座も多数開催。',
      qualifications: ['全米ヨガアライアンス RYT500', 'マインドフルネス瞑想指導者', 'アーユルヴェーダヘルスコーチ'],
    },
  })
  console.log('✅ 著者情報を更新しました')

  for (const article of SAMPLE_ARTICLES) {
    const category = await prisma.categories.findUnique({
      where: { slug: article.categorySlug },
    })

    if (!category) {
      console.log(`❌ カテゴリ ${article.categorySlug} が見つかりません`)
      continue
    }

    // 既存の記事をチェック
    const existing = await prisma.articles.findUnique({
      where: { slug: article.slug },
    })

    if (existing) {
      console.log(`⏭️ 記事は既に存在します: ${article.title}`)
      continue
    }

    await prisma.articles.create({
      data: {
        id: `article-${article.slug}`,
        title: article.title,
        slug: article.slug,
        blocks: article.blocks,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 過去7日以内
        authorId: 'default-author',
        categoryId: category.id,
        brandId: DEFAULT_BRAND_ID,
        createdById: DEFAULT_USER_ID,
        updatedAt: new Date(),
      },
    })
    console.log(`✅ 記事を作成: ${article.title}`)
  }

  console.log('✅ サンプル記事の追加が完了しました')
}

main().finally(() => prisma.$disconnect())
