/**
 * HTMLサニタイズユーティリティ
 * XSS攻撃を防ぐために、ユーザー入力のHTMLをサニタイズする
 */

import sanitizeHtml from 'sanitize-html';

// 許可するHTMLタグとその属性
const ALLOWED_TAGS = [
  // テキストフォーマット
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  // 見出し
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // リスト
  'ul', 'ol', 'li',
  // テーブル
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  // 引用・コード
  'blockquote', 'pre', 'code',
  // リンク・画像
  'a', 'img',
  // その他
  'hr', 'span', 'div', 'figure', 'figcaption',
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  '*': ['class', 'id', 'style'],
  table: ['border', 'cellpadding', 'cellspacing'],
  th: ['colspan', 'rowspan', 'scope'],
  td: ['colspan', 'rowspan'],
};

// 許可するURLスキーム
const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

// 許可するスタイルプロパティ（XSSリスクの低いもののみ）
// sanitize-html の allowedStyles 形式: { [tag]: { [property]: RegExp[] } }
const ALLOWED_STYLES_MAP: Record<string, Record<string, RegExp[]>> = {
  '*': {
    'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, /^[a-z]+$/i],
    'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, /^[a-z]+$/i],
    'text-align': [/^(left|right|center|justify)$/],
    'font-weight': [/^(normal|bold|bolder|lighter|\d{3})$/],
    'font-style': [/^(normal|italic|oblique)$/],
    'text-decoration': [/^(none|underline|overline|line-through)$/],
    'margin': [/^-?\d+(\.\d+)?(px|em|rem|%)?$/],
    'margin-top': [/^-?\d+(\.\d+)?(px|em|rem|%)?$/],
    'margin-bottom': [/^-?\d+(\.\d+)?(px|em|rem|%)?$/],
    'margin-left': [/^-?\d+(\.\d+)?(px|em|rem|%)?$/],
    'margin-right': [/^-?\d+(\.\d+)?(px|em|rem|%)?$/],
    'padding': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
    'padding-top': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
    'padding-bottom': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
    'padding-left': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
    'padding-right': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
  },
};

/**
 * HTMLコンテンツをサニタイズする
 * @param html サニタイズ対象のHTML文字列
 * @returns サニタイズされたHTML文字列
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedStyles: ALLOWED_STYLES_MAP,
    // target="_blank" にはrel="noopener noreferrer"を自動追加
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === '_blank') {
          attribs.rel = 'noopener noreferrer';
        }
        return { tagName, attribs };
      },
    },
    // 危険なプロトコルを持つURLを削除
    exclusiveFilter: (frame) => {
      // javascript: や data: URLを持つリンクを削除
      if (frame.tag === 'a' && frame.attribs.href) {
        const href = frame.attribs.href.toLowerCase().trim();
        if (href.startsWith('javascript:') || href.startsWith('data:')) {
          return true;
        }
      }
      // 同様にimgタグのdata: URLもチェック（ただし画像のdata:は許可しても良い場合もある）
      return false;
    },
  });
}

/**
 * 記事ブロックのコンテンツをサニタイズする
 * HTMLブロックのみサニタイズし、他のブロックタイプはそのまま返す
 */
export function sanitizeBlocks(blocks: Array<{ id: string; type: string; content?: string; data?: Record<string, unknown> }>): Array<{ id: string; type: string; content?: string; data?: Record<string, unknown> }> {
  return blocks.map((block) => {
    // HTMLブロックの場合のみサニタイズ
    if (block.type === 'html' && block.content) {
      return {
        ...block,
        content: sanitizeHtmlContent(block.content),
      };
    }
    return block;
  });
}
