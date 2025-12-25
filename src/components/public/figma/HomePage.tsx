"use client";

import { useRouter } from "next/navigation";
import { PublicArticle, Category } from "@/lib/use-public-data";
import { Main } from "./imports/Container";

interface HomePageProps {
  articles?: PublicArticle[];
  categories?: Category[];
}

export default function HomePage({ articles = [], categories = [] }: HomePageProps) {
  const router = useRouter();

  const handleArticleClick = (categorySlug?: string, slug?: string) => {
    // 実際に記事がクリックされた際の遷移処理が必要な場合はここで実装
    // コンポーネント内部で onArticleClick が呼ばれることを想定
  };

  return (
    <div className="w-full bg-white">
      {/* 
          Mainコンポーネントは内部で mt-[220px] (モバイルは mt-[60px]) を持っている。
          PublicPageLayout のヘッダーとの兼ね合いで調整が必要な場合は
          ここでラッパーのクラスを指定する。
      */}
      <div className="max-w-[1760px] mx-auto overflow-hidden">
        <Main
          articles={articles}
          categories={categories}
          onArticleClick={() => {
            // Main内部のボタンクリック時の挙動（必要に応じて実装）
          }}
        />
      </div>
    </div>
  );
}