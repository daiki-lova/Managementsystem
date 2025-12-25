'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/admin/lib/auth-context';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { ImageWithFallback } from '@/components/public/ImageWithFallback';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import DOMPurify from 'dompurify';

interface PreviewArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  blocks: BlockData[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogpImageUrl: string | null;
  publishedAt: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
    role: string;
    bio: string;
    imageUrl: string | null;
    qualifications: unknown;
  };
  thumbnail: {
    url: string;
    altText: string | null;
  } | null;
  tags: Array<{ id: string; name: string; slug: string }>;
}

interface BlockData {
  type: string;
  content?: string;
  src?: string;
  alt?: string;
  level?: number;
  items?: string[];
  data?: { altText?: string };
  metadata?: { altText?: string; slot?: string };
}

function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
      'a',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'figure', 'figcaption', 'img', 'picture', 'source',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'blockquote', 'q', 'cite', 'code', 'pre', 'kbd', 'samp', 'var',
      'br', 'hr', 'abbr', 'address', 'time', 'details', 'summary',
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'href', 'target', 'rel', 'title',
      'src', 'alt', 'width', 'height', 'loading', 'data-image-slot',
      'start', 'type', 'colspan', 'rowspan', 'scope', 'cite', 'datetime', 'open',
      'srcset', 'media',
    ],
  });
}

function getListItems(block: BlockData): string[] {
  if (block.items && block.items.length > 0) {
    return block.items;
  }
  if (block.content) {
    return block.content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  return [];
}

function getImageAlt(block: BlockData): string {
  return block.alt ?? block.data?.altText ?? block.metadata?.altText ?? '';
}

function getImageSrc(block: BlockData): string {
  return block.src ?? block.content ?? '';
}

function renderBlock(block: BlockData, index: number) {
  switch (block.type) {
    case 'paragraph':
    case 'p':
      return (
        <p key={index} className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-6">
          {block.content}
        </p>
      );
    case 'heading':
    case 'h2':
      return (
        <h2 key={index} className="font-[var(--font-noto-sans-jp)] font-bold text-[24px] text-black tracking-[0.2px] mb-4 mt-10">
          {block.content}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={index} className="font-[var(--font-noto-sans-jp)] font-bold text-[20px] text-black tracking-[0.2px] mb-3 mt-8">
          {block.content}
        </h3>
      );
    case 'h4':
      return (
        <h4 key={index} className="font-[var(--font-noto-sans-jp)] font-bold text-[18px] text-black tracking-[0.2px] mb-2 mt-6">
          {block.content}
        </h4>
      );
    case 'image': {
      const imgSrc = getImageSrc(block);
      const imgAlt = getImageAlt(block);
      return (
        <figure key={index} className="mb-6">
          <ImageWithFallback
            src={imgSrc}
            alt={imgAlt}
            className="w-full h-auto object-cover"
          />
          {imgAlt && (
            <figcaption className="font-[var(--font-noto-sans-jp)] font-[350] leading-[20.8px] text-[13px] text-black tracking-[0.16px] mt-3">
              {imgAlt}
            </figcaption>
          )}
        </figure>
      );
    }
    case 'list':
    case 'ul': {
      const ulItems = getListItems(block);
      if (ulItems.length === 0) return null;
      return (
        <ul key={index} className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] list-disc pl-6 space-y-2 mb-6">
          {ulItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    case 'ol': {
      const olItems = getListItems(block);
      if (olItems.length === 0) return null;
      return (
        <ol key={index} className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] list-decimal pl-6 space-y-2 mb-6">
          {olItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    }
    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-4 border-black pl-4 italic font-[var(--font-noto-sans-jp)] font-light text-[#1f1f1f] text-[16px] mb-6">
          {block.content}
        </blockquote>
      );
    case 'hr':
      return <hr key={index} className="border-t border-[#e0e0e0] my-8" />;
    case 'html': {
      if (!block.content) return null;
      const sanitized = sanitizeHtml(block.content);
      return (
        <div
          key={index}
          className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-6 [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    }
    // 古い形式のブロックタイプ（introduction, section, conclusion）をサポート
    case 'introduction':
    case 'section':
    case 'conclusion':
      if (!block.content) return null;
      return (
        <p key={index} className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-6 whitespace-pre-line">
          {block.content}
        </p>
      );
    // callout/internal-linkタイプもサポート
    case 'callout':
      return (
        <div key={index} className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="font-[var(--font-noto-sans-jp)] font-medium text-[#1f1f1f] text-[16px]">
            {block.content}
          </p>
        </div>
      );
    case 'internal-link':
      return (
        <p key={index} className="font-[var(--font-noto-sans-jp)] font-light text-[#1f1f1f] text-[16px] mb-6">
          {block.content}
        </p>
      );
    default:
      // 未知のタイプでもcontentがあれば表示
      if (block.content) {
        return (
          <p key={index} className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-6">
            {block.content}
          </p>
        );
      }
      return null;
  }
}

function AuthorProfile({
  author,
}: {
  author: PreviewArticle['author'];
}) {
  const qualifications = Array.isArray(author.qualifications) ? author.qualifications : [];

  return (
    <div className="border border-[#e0e0e0] p-5 md:p-[24px]">
      <div className="text-center mb-4 md:mb-[20px]">
        <div className="w-20 h-20 md:w-[100px] md:h-[100px] rounded-full overflow-hidden mx-auto mb-3 md:mb-[16px]">
          <ImageWithFallback
            src={author.imageUrl || 'https://images.unsplash.com/photo-1667890785988-8da12fd0989b?w=200&q=80'}
            alt={author.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="font-[var(--font-noto-sans)] font-bold text-[14px] md:text-[16px] tracking-[1.2px] md:tracking-[1.4px] uppercase mb-1 md:mb-[8px]">
          {author.name}
        </h3>
        <p className="font-[var(--font-noto-sans-jp)] font-medium text-[11px] md:text-[12px] text-[#666] tracking-[0.2px]">
          {author.role}
        </p>
      </div>

      <div className="mb-4 md:mb-[20px]">
        <h4 className="font-[var(--font-noto-sans)] font-bold text-[11px] md:text-[13px] tracking-[1.2px] uppercase mb-2 md:mb-[12px]">
          Profile
        </h4>
        <p className="font-[var(--font-noto-sans-jp)] font-light leading-[1.6] text-[12px] md:text-[13px] text-[#1f1f1f] tracking-[0.2px]">
          {author.bio}
        </p>
      </div>

      {qualifications.length > 0 && (
        <div>
          <h4 className="font-[var(--font-noto-sans)] font-bold text-[11px] md:text-[13px] tracking-[1.2px] uppercase mb-2 md:mb-[12px]">
            Certifications
          </h4>
          <ul className="space-y-1 md:space-y-2">
            {qualifications.map((qual, i) => (
              <li
                key={i}
                className="font-[var(--font-noto-sans-jp)] font-light text-[11px] md:text-[12px] text-[#1f1f1f] tracking-[0.2px] flex items-start"
              >
                <span className="mr-2">•</span>
                <span>{String(qual)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TagsSection({
  tags,
}: {
  tags: PreviewArticle['tags'];
}) {
  if (tags.length === 0) return null;

  return (
    <section className="mt-10 pt-6 md:mt-[60px] md:pt-[40px] border-t border-[#e0e0e0]">
      <div className="mb-3 md:mb-[16px]">
        <span className="font-[var(--font-noto-sans)] font-bold text-[12px] md:text-[14px] tracking-[1.2px] md:tracking-[1.4px] uppercase">
          Tags
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="px-3 md:px-4 py-2 border border-black font-[var(--font-noto-sans-jp)] font-medium text-[11px] md:text-[13px]"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </section>
  );
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [article, setArticle] = useState<PreviewArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);

  // パラメータを取得
  useEffect(() => {
    params.then(({ id }) => setArticleId(id));
  }, [params]);

  // 記事データを取得
  useEffect(() => {
    if (!articleId || !isAuthenticated) return;

    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/preview/article/${articleId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error?.message || '記事の取得に失敗しました');
          return;
        }

        setArticle(data.data);
      } catch {
        setError('記事の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId, isAuthenticated]);

  // 認証チェック中
  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  // 未認証
  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">認証が必要です</h1>
          <p className="text-gray-600 mb-4">プレビューを表示するにはログインしてください。</p>
          <Link
            href="/admin"
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  // ローディング
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  // エラー
  if (error || !article) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">記事が見つかりません</h1>
          <p className="text-gray-600 mb-4">{error || 'この記事は存在しないか、削除されています。'}</p>
          <Link
            href="/admin"
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            管理画面に戻る
          </Link>
        </div>
      </div>
    );
  }

  const blocks = Array.isArray(article.blocks) ? article.blocks : [];
  const formattedDate = article.publishedAt
    ? format(new Date(article.publishedAt), 'yyyy年M月d日', { locale: ja })
    : '';

  // htmlブロックの処理
  const htmlBlocks = blocks.filter((b) => b.type === 'html');
  const useHtmlBlockAsMain = htmlBlocks.length > 0;
  const primaryHtmlBlock = useHtmlBlockAsMain ? htmlBlocks[0] : null;

  // HTMLブロック内にhero画像がある場合、サムネイル表示をスキップ（重複を避ける）
  const htmlHasHeroImage = primaryHtmlBlock?.content?.includes('position="hero"') ||
    (primaryHtmlBlock?.content?.indexOf('<figure') ?? -1) < 500;

  // ステータスラベル
  const statusLabels: Record<string, { text: string; color: string }> = {
    DRAFT: { text: '下書き', color: 'bg-yellow-500' },
    REVIEW: { text: 'レビュー中', color: 'bg-blue-500' },
    PUBLISHED: { text: '公開中', color: 'bg-green-500' },
    SCHEDULED: { text: '予約公開', color: 'bg-purple-500' },
  };
  const status = statusLabels[article.status] || { text: article.status, color: 'bg-gray-500' };

  return (
    <div className="w-full bg-white overflow-x-hidden">
      {/* プレビューバナー */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black py-2 px-4 text-center text-sm font-medium shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <span className={`px-2 py-0.5 rounded text-white text-xs ${status.color}`}>
            {status.text}
          </span>
          <span>プレビューモード - 公開前の確認用表示です</span>
          <Link
            href="/admin"
            className="ml-4 px-3 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors"
          >
            管理画面に戻る
          </Link>
        </div>
      </div>

      <Header />

      {/* ヘッダースペース（プレビューバナー分追加） */}
      <div className="h-[148px] md:h-[200px]" />

      <main className="px-5 py-8 md:px-[104px] md:py-[60px]">
        {/* カテゴリータグ */}
        <div className="text-center mb-4 md:mb-[24px]">
          <span className="font-[var(--font-noto-sans)] font-bold text-[10px] md:text-[12px] tracking-[1.5px] md:tracking-[1.8px] uppercase">
            {article.category.name}
          </span>
        </div>

        {/* タイトル */}
        <h1 className="font-[var(--font-noto-sans-jp)] font-bold leading-[1.4] md:leading-[49px] text-[22px] md:text-[35px] text-black text-center tracking-[0.4px] md:tracking-[0.808px] mb-6 md:mb-[40px] max-w-[1074px] mx-auto">
          {article.title}
        </h1>

        {/* 著者・日付情報 */}
        <div className="text-center mb-8 md:mb-[60px] space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="font-[var(--font-noto-sans)] font-bold text-[10px] md:text-[12px] tracking-[1.4px] md:tracking-[1.964px] uppercase">
              By
            </span>
            <span className="font-[var(--font-noto-sans)] font-bold text-[10px] md:text-[12px] tracking-[1.4px] md:tracking-[1.964px] uppercase">
              {article.author.name}
            </span>
          </div>
          {formattedDate && (
            <p className="font-[var(--font-noto-sans-jp)] font-medium text-[11px] md:text-[12px] text-[#666] md:text-[#1f1f1f] tracking-[-0.1px]">
              {formattedDate}
            </p>
          )}
        </div>

        {/* メインコンテンツエリア */}
        <div className="max-w-[1280px] mx-auto">
          <div className="md:flex md:gap-[60px] md:justify-center">
            {/* 左側：記事本文 */}
            <article className="flex-1 max-w-[760px]">
              {/* メイン画像（HTMLブロック内にhero画像がある場合はスキップ） */}
              {article.thumbnail && !htmlHasHeroImage && (
                <figure className="mb-6 md:mb-[40px]">
                  <ImageWithFallback
                    src={article.thumbnail.url}
                    alt={article.thumbnail.altText || article.title}
                    className="w-full h-auto object-cover"
                  />
                </figure>
              )}

              {/* 記事本文 */}
              <div className="space-y-0">
                {useHtmlBlockAsMain && primaryHtmlBlock ? (
                  <div
                    className="article-content prose prose-lg max-w-none font-[var(--font-noto-sans-jp)]
                      [&_h2]:font-bold [&_h2]:text-[24px] [&_h2]:text-black [&_h2]:tracking-[0.2px] [&_h2]:mb-4 [&_h2]:mt-10
                      [&_h3]:font-bold [&_h3]:text-[20px] [&_h3]:text-black [&_h3]:tracking-[0.2px] [&_h3]:mb-3 [&_h3]:mt-8
                      [&_h4]:font-bold [&_h4]:text-[18px] [&_h4]:text-black [&_h4]:tracking-[0.2px] [&_h4]:mb-2 [&_h4]:mt-6
                      [&_p]:font-light [&_p]:leading-[1.8] [&_p]:text-[#1f1f1f] [&_p]:text-[16px] [&_p]:tracking-[0.4px] [&_p]:mb-6
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-6
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:mb-6
                      [&_li]:font-light [&_li]:leading-[1.8] [&_li]:text-[#1f1f1f] [&_li]:text-[16px] [&_li]:tracking-[0.4px]
                      [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800
                      [&_blockquote]:border-l-4 [&_blockquote]:border-black [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:mb-6
                      [&_figure]:mb-6 [&_figcaption]:text-[13px] [&_figcaption]:text-black [&_figcaption]:mt-3
                      [&_img]:w-full [&_img]:h-auto [&_img]:object-cover
                      [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6
                      [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50
                      [&_td]:border [&_td]:border-gray-300 [&_td]:p-2
                      [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:mb-6
                      [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(primaryHtmlBlock.content || '') }}
                  />
                ) : (
                  blocks.map((block, index) => renderBlock(block, index))
                )}
              </div>

              {/* タグセクション */}
              <TagsSection tags={article.tags} />

              {/* 著者プロフィール（モバイル用） */}
              <div className="md:hidden mt-8">
                <AuthorProfile author={article.author} />
              </div>
            </article>

            {/* 右側：サイドバー（デスクトップのみ） */}
            <aside className="hidden md:block w-[320px] flex-shrink-0 space-y-[32px]">
              <AuthorProfile author={article.author} />
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
