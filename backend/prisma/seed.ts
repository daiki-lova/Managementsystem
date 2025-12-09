import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // デフォルト設定の作成
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
  console.log("✓ System settings created");

  // デフォルトブランドの作成
  const defaultBrand = await prisma.brand.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "デフォルトブランド",
      slug: "default",
      description: "デフォルトのブランドです",
      isDefault: true,
    },
  });
  console.log("✓ Default brand created");

  // デフォルトカテゴリの作成
  const categories = [
    { name: "ヨガポーズ", slug: "yoga-poses", color: "#3B82F6" },
    { name: "ヨガ哲学", slug: "yoga-philosophy", color: "#8B5CF6" },
    { name: "健康・ウェルネス", slug: "health-wellness", color: "#10B981" },
    { name: "瞑想・マインドフルネス", slug: "meditation", color: "#F59E0B" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("✓ Categories created");

  // デフォルト監修者の作成
  const defaultAuthor = await prisma.author.upsert({
    where: { id: "default-author" },
    update: {},
    create: {
      id: "default-author",
      name: "監修者名",
      role: "ヨガインストラクター",
      qualifications: ["RYT200", "全米ヨガアライアンス認定"],
      bio: "ヨガ歴10年以上の経験を持つインストラクターです。",
      systemPrompt: `あなたは経験豊富なヨガインストラクターです。
以下の点を意識して記事を執筆してください：
- 初心者にも分かりやすい説明
- 安全面への配慮
- 科学的根拠に基づいた情報提供
- 実践的なアドバイス`,
    },
  });
  console.log("✓ Default author created");

  // オーナーユーザーの作成（パスワードはSupabase Authで管理）
  // 注意: 実際のパスワードはSupabase側で設定する必要があります
  await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      email: "owner@example.com",
      password: "placeholder", // Supabase Auth ID に置き換える
      role: UserRole.OWNER,
      name: "オーナー",
    },
  });
  console.log("✓ Owner user created");

  console.log("\n✅ Seeding completed!");
  console.log("\n⚠️  注意: owner@example.com のパスワードはSupabase Authで設定してください");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
