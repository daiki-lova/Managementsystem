import { Page, expect } from '@playwright/test';

/**
 * 管理画面のベースURL
 */
export const ADMIN_URL = 'http://localhost:5000';

/**
 * 公開サイト/APIのベースURL
 */
export const PUBLIC_URL = 'http://localhost:3001';

/**
 * テストデータのID定数
 */
export const TEST_IDS = {
  categories: {
    yogaPoses: 'yoga-poses',
    yogaPhilosophy: 'yoga-philosophy',
    healthWellness: 'health-wellness',
    meditation: 'meditation',
  },
  authors: {
    yamada: 'e2e-author-1',
    tanaka: 'e2e-author-2',
  },
  conversions: {
    trial: 'e2e-cv-1',
    ryt200: 'e2e-cv-2',
  },
  articles: {
    firstPublished: 'e2e-article-yoga-poses-3',
  },
  slugHistory: {
    oldSlug: 'old-yoga-article-slug',
    newSlug: 'yoga-poses-article-1',
  },
};

/**
 * 管理画面にログイン
 */
export async function loginToAdmin(page: Page): Promise<void> {
  await page.goto(ADMIN_URL);

  // ログインボタンをクリック（モック認証）
  await page.getByRole('button', { name: 'ログイン' }).click();

  // ダッシュボードが表示されるまで待機
  await expect(page.locator('aside')).toBeVisible({ timeout: 10000 });
}

/**
 * 管理画面からログアウト
 */
export async function logoutFromAdmin(page: Page): Promise<void> {
  // ユーザーメニューを開く
  await page.locator('[data-testid="user-menu"]').click();
  await page.getByText('ログアウト').click();

  // ログイン画面が表示されるまで待機
  await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
}

/**
 * サイドバーのタブに移動
 */
export async function navigateToTab(page: Page, tabName: string): Promise<void> {
  // exact: true で完全一致を指定し、サイドバーのナビゲーションボタンを特定
  const sidebarButton = page.locator('aside').getByRole('button', { name: tabName, exact: true });

  if (await sidebarButton.isVisible()) {
    await sidebarButton.click();
  } else {
    // サイドバー内にない場合は通常のボタンを探す
    await page.getByRole('button', { name: tabName, exact: true }).first().click();
  }

  await page.waitForLoadState('networkidle');
}

/**
 * テーブルの行数を取得
 */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.locator('table tbody tr');
  return await rows.count();
}

/**
 * 確認ダイアログでOKをクリック
 */
export async function confirmDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: '削除' }).click();
}

/**
 * 確認ダイアログでキャンセルをクリック
 */
export async function cancelDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'キャンセル' }).click();
}

/**
 * トースト通知を待機
 */
export async function waitForToast(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
}

/**
 * APIリクエストを待機
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForResponse(urlPattern);
}

/**
 * 日付を日本語フォーマットで取得
 */
export function formatDateJa(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ランダムな文字列を生成
 */
export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * ページが完全にロードされるまで待機
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

/**
 * 公開サイトのSEOメタデータを検証
 */
export async function verifySeoMetadata(
  page: Page,
  expected: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }
): Promise<void> {
  if (expected.title) {
    await expect(page).toHaveTitle(expected.title);
  }

  if (expected.description) {
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', expected.description);
  }

  if (expected.ogTitle) {
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', expected.ogTitle);
  }

  if (expected.ogDescription) {
    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute('content', expected.ogDescription);
  }

  if (expected.ogImage) {
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', expected.ogImage);
  }
}

/**
 * レスポンシブビューポートのサイズ
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

/**
 * ビューポートを設定
 */
export async function setViewport(
  page: Page,
  viewport: 'mobile' | 'tablet' | 'desktop'
): Promise<void> {
  await page.setViewportSize(VIEWPORTS[viewport]);
}
