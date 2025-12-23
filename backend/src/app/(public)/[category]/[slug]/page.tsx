import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import { ImageWithFallback } from '@/components/public/ImageWithFallback';
import {
  getArticleBySlug,
  getArticleByOldSlug,
  getRelatedArticles,
  getPopularArticles,
  getCategories,
} from '@/lib/public-data';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import sanitizeHtmlLib from 'sanitize-html';

// ISR: 60秒ごとに再検証
export const revalidate = 60;

// メタデータ生成
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: '記事が見つかりません | RADIANCE',
    };
  }

  return {
    title: article.metaTitle || `${article.title} | RADIANCE`,
    description: article.metaDescription || article.title,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.title,
      type: 'article',
      publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
      images: article.ogpImageUrl ? [article.ogpImageUrl] : [],
    },
  };
}

// ブロックデータの型（データ揺れに対応）
interface BlockData {
  type: string;
  content?: string;
  src?: string;
  alt?: string;
  level?: number;
  items?: string[];
  // データ揺れ対応: 異なるフォーマットのaltText格納場所
  data?: { altText?: string };
  metadata?: { altText?: string; slot?: string };
}

// 共通のサニタイズ設定（公開ページ・プレビュー共通で使用）
// 公開ページではsanitize-html、プレビューではDOMPurifyを使用するが設定は統一
// style属性は許可しない（CSSベースの攻撃を防ぐ）
const SANITIZE_ALLOWED_TAGS: string[] = [
  // 構造
  'div', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav',
  // 見出し
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // テキスト
  'p', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
  // リンク
  'a',
  // リスト
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // 画像・メディア
  'figure', 'figcaption', 'img', 'picture', 'source',
  // テーブル
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  // 引用・コード
  'blockquote', 'q', 'cite', 'code', 'pre', 'kbd', 'samp', 'var',
  // その他
  'br', 'hr', 'abbr', 'address', 'time', 'details', 'summary',
];

const SANITIZE_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  '*': ['class', 'id'],
  'a': ['href', 'target', 'rel', 'title'],
  'img': ['src', 'alt', 'width', 'height', 'loading', 'data-image-slot'],
  'figure': ['data-image-slot'],
  'div': ['data-image-slot'],
  'ol': ['start', 'type'],
  'th': ['colspan', 'rowspan', 'scope'],
  'td': ['colspan', 'rowspan'],
  'blockquote': ['cite'],
  'q': ['cite'],
  'abbr': ['title'],
  'time': ['datetime'],
  'details': ['open'],
  'source': ['srcset', 'media', 'type'],
};

// HTMLサニタイズ（記事本文用：sanitize-htmlライブラリ使用）
function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: SANITIZE_ALLOWED_TAGS,
    allowedAttributes: SANITIZE_ALLOWED_ATTRIBUTES,
    // 外部リンクにtarget="_blank"とrel="noopener noreferrer"を自動追加
    transformTags: {
      'a': (tagName, attribs) => {
        const href = attribs.href || '';
        // 外部リンク（http/httpsで始まる）の場合
        if (href.startsWith('http://') || href.startsWith('https://')) {
          return {
            tagName: 'a',
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          };
        }
        return { tagName, attribs };
      },
    },
    // javascript:などの危険なURLスキームを除去
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // 空タグは除去しない（brやhrなど）
    allowVulnerableTags: false,
  });
}

// リストアイテムを取得（itemsがない場合はcontentを行分割）
function getListItems(block: BlockData): string[] {
  if (block.items && block.items.length > 0) {
    return block.items;
  }
  // itemsがない場合、contentを行分割してitemsとして扱う
  if (block.content) {
    return block.content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  return [];
}

// 画像のalt属性を取得（複数のパスからフォールバック）
function getImageAlt(block: BlockData): string {
  return block.alt ?? block.data?.altText ?? block.metadata?.altText ?? '';
}

// 画像のsrc属性を取得（srcがない場合はcontentを使用）
function getImageSrc(block: BlockData): string {
  return block.src ?? block.content ?? '';
}

// ブロックコンテンツのレンダリング
function renderBlock(block: BlockData) {
  switch (block.type) {
    case 'paragraph':
    case 'p':
      return (
        <p className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-6">
          {block.content}
        </p>
      );
    case 'heading':
    case 'h2':
      return (
        <h2 className="font-[var(--font-noto-sans-jp)] font-bold text-[24px] text-black tracking-[0.2px] mb-4 mt-10">
          {block.content}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="font-[var(--font-noto-sans-jp)] font-bold text-[20px] text-black tracking-[0.2px] mb-3 mt-8">
          {block.content}
        </h3>
      );
    case 'h4':
      return (
        <h4 className="font-[var(--font-noto-sans-jp)] font-bold text-[18px] text-black tracking-[0.2px] mb-2 mt-6">
          {block.content}
        </h4>
      );
    case 'image': {
      const imgSrc = getImageSrc(block);
      const imgAlt = getImageAlt(block);
      return (
        <figure className="mb-6">
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
        <ul className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] list-disc pl-6 space-y-2 mb-6">
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
        <ol className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] list-decimal pl-6 space-y-2 mb-6">
          {olItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    }
    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-black pl-4 italic font-[var(--font-noto-sans-jp)] font-light text-[#1f1f1f] text-[16px] mb-6">
          {block.content}
        </blockquote>
      );
    case 'hr':
      return <hr className="border-t border-[#e0e0e0] my-8" />;
    case 'html': {
      // HTMLブロック: サニタイズしてレンダリング（内部リンク等に対応）
      if (!block.content) return null;
      const sanitized = sanitizeHtml(block.content);
      return (
        <div
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
        <p className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-6 whitespace-pre-line">
          {block.content}
        </p>
      );
    // callout/internal-linkタイプもサポート
    case 'callout':
      return (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="font-[var(--font-noto-sans-jp)] font-medium text-[#1f1f1f] text-[16px]">
            {block.content}
          </p>
        </div>
      );
    case 'internal-link':
      return (
        <p className="font-[var(--font-noto-sans-jp)] font-light text-[#1f1f1f] text-[16px] mb-6">
          {block.content}
        </p>
      );
    default:
      // 未知のタイプでもcontentがあれば表示
      if (block.content) {
        return (
          <p className="font-[var(--font-noto-sans-jp)] font-light leading-[1.8] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-6">
            {block.content}
          </p>
        );
      }
      return null;
  }
}

// 関連記事コンポーネント
function RelatedArticles({
  articles,
}: {
  articles: Awaited<ReturnType<typeof getRelatedArticles>>;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10 md:mt-[60px]">
      <h3 className="font-[var(--font-noto-sans)] font-bold text-[16px] md:text-[20px] tracking-[1.4px] uppercase mb-5 md:mb-[32px]">
        Related Articles
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-[24px]">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/${article.categories.slug}/${article.slug}`}
            className="group cursor-pointer"
          >
            <div className="aspect-square overflow-hidden bg-gray-100 mb-2 md:mb-3">
              <ImageWithFallback
                src={article.media_assets?.url || 'https://images.unsplash.com/photo-1610562269919-86791081ad29?w=800&q=80'}
                alt={article.media_assets?.altText || article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="mb-1 md:mb-2">
              <span className="font-[var(--font-noto-sans)] font-bold text-[9px] md:text-[10px] tracking-[1.4px] md:tracking-[1.6px] uppercase">
                {article.categories.name}
              </span>
            </div>
            <h4 className="font-[var(--font-noto-sans-jp)] font-medium leading-[1.4] text-[12px] md:text-[14px] text-black group-hover:underline line-clamp-2">
              {article.title}
            </h4>
          </Link>
        ))}
      </div>
    </section>
  );
}

// 人気記事サイドバー
function PopularArticlesSidebar({
  articles,
}: {
  articles: Awaited<ReturnType<typeof getPopularArticles>>;
}) {
  if (articles.length === 0) return null;

  return (
    <div className="border border-[#e0e0e0] p-[24px]">
      <h4 className="font-[var(--font-noto-sans)] font-bold text-[14px] tracking-[1.4px] uppercase mb-[24px]">
        Popular Articles
      </h4>
      <div className="space-y-[24px]">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/${article.categories.slug}/${article.slug}`}
            className="group cursor-pointer block"
          >
            <div className="aspect-[16/9] overflow-hidden bg-gray-100 mb-2">
              <ImageWithFallback
                src={article.media_assets?.url || 'https://images.unsplash.com/photo-1610562269919-86791081ad29?w=800&q=80'}
                alt={article.media_assets?.altText || article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="mb-1">
              <span className="font-[var(--font-noto-sans)] font-bold text-[9px] tracking-[1.4px] uppercase">
                {article.categories.name}
              </span>
            </div>
            <h5 className="font-[var(--font-noto-sans-jp)] font-medium leading-[18px] text-[13px] text-black group-hover:underline line-clamp-2">
              {article.title}
            </h5>
          </Link>
        ))}
      </div>
    </div>
  );
}

// 著者プロフィール
function AuthorProfile({
  author,
}: {
  author: {
    name: string;
    role: string;
    bio: string;
    imageUrl: string | null;
    qualifications: unknown;
  };
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

// タグセクション
function TagsSection({
  tags,
}: {
  tags: Array<{ id: string; name: string; slug: string }>;
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
          <Link
            key={tag.id}
            href={`/tag/${tag.slug}`}
            className="px-3 md:px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors whitespace-nowrap font-[var(--font-noto-sans-jp)] font-medium text-[11px] md:text-[13px]"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category: categorySlug, slug } = await params;

  // 記事取得
  const article = await getArticleBySlug(slug);

  // 記事が見つからない場合、旧Slugをチェック（301リダイレクト）
  if (!article) {
    const oldSlugData = await getArticleByOldSlug(slug);
    if (oldSlugData) {
      // 新しいSlugにリダイレクト
      redirect(`/${categorySlug}/${oldSlugData.newSlug}`);
    }
    notFound();
  }

  // カテゴリが一致しない場合は正しいURLにリダイレクト
  if (article.categories.slug !== categorySlug) {
    redirect(`/${article.categories.slug}/${slug}`);
  }

  // 関連記事、人気記事、カテゴリ一覧を並列取得
  const [relatedArticles, popularArticles, categories] = await Promise.all([
    getRelatedArticles(article.id, article.categories.id, 8),
    getPopularArticles(5),
    getCategories(),
  ]);

  const blocks = Array.isArray(article.blocks) ? article.blocks : [];
  const formattedDate = article.publishedAt
    ? format(new Date(article.publishedAt), 'yyyy年M月d日', { locale: ja })
    : '';

  // htmlブロック正のロジック：htmlブロックがあればそれのみを描画
  const htmlBlocks = blocks.filter((b: BlockData) => b.type === 'html');
  const useHtmlBlockAsMain = htmlBlocks.length > 0;
  // 複数ある場合は最初の1つを採用（警告ログ）
  if (htmlBlocks.length > 1) {
    console.warn(`[Article ${article.slug}] 複数のhtmlブロックがあります。最初の1つのみを使用します。`);
  }
  const primaryHtmlBlock = useHtmlBlockAsMain ? (htmlBlocks[0] as BlockData) : null;

  // HTMLブロック内にhero画像がある場合、サムネイル表示をスキップ（重複を避ける）
  const htmlHasHeroImage = primaryHtmlBlock?.content?.includes('position="hero"') ||
    primaryHtmlBlock?.content?.match(/<figure[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<\/figure>[\s\S]{0,500}<article/i) ||
    (primaryHtmlBlock?.content?.indexOf('<figure') ?? -1) < 500;

  return (
    <PublicPageLayout categories={categories}>

      {/* ヘッダースペース */}
      <div className="h-[108px] md:h-[160px]" />

      <main className="px-5 py-8 md:px-[104px] md:py-[60px]">
        {/* カテゴリータグ */}
        <div className="text-center mb-4 md:mb-[24px]">
          <Link
            href={`/${article.categories.slug}`}
            className="font-[var(--font-noto-sans)] font-bold text-[10px] md:text-[12px] tracking-[1.5px] md:tracking-[1.8px] uppercase hover:underline"
          >
            {article.categories.name}
          </Link>
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
              {article.authors.name}
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
              {article.media_assets && !htmlHasHeroImage && (
                <figure className="mb-6 md:mb-[40px]">
                  <ImageWithFallback
                    src={article.media_assets.url}
                    alt={article.media_assets.altText || article.title}
                    className="w-full h-auto object-cover"
                  />
                </figure>
              )}

              {/* 記事本文 */}
              <div className="space-y-0">
                {useHtmlBlockAsMain && primaryHtmlBlock ? (
                  // htmlブロック正：htmlブロックのみを描画
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
                  // 従来のブロック描画
                  blocks.map((block, index) => (
                    <div key={index}>
                      {renderBlock(block as BlockData)}
                    </div>
                  ))
                )}
              </div>

              {/* タグセクション */}
              <TagsSection tags={article.tags} />

              {/* 関連記事（モバイル用） */}
              <div className="md:hidden">
                {/* 著者プロフィール */}
                <div className="mt-8">
                  <AuthorProfile author={article.authors} />
                </div>

                <RelatedArticles articles={relatedArticles} />
              </div>

              {/* 関連記事（デスクトップ用） */}
              <div className="hidden md:block">
                <RelatedArticles articles={relatedArticles} />
              </div>
            </article>

            {/* 右側：サイドバー（デスクトップのみ） */}
            <aside className="hidden md:block w-[320px] flex-shrink-0 space-y-[32px]">
              {/* 著者プロフィール */}
              <AuthorProfile author={article.authors} />

              {/* 人気記事 */}
              <PopularArticlesSidebar articles={popularArticles} />
            </aside>
          </div>
        </div>
      </main>

    </PublicPageLayout>
  );
}
