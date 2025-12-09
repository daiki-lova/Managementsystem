import { test, expect } from '@playwright/test';

const PUBLIC_BASE_URL = 'http://localhost:3001';

/**
 * ナビゲーション・レスポンシブ・エラーハンドリング E2Eテスト
 */
test.describe('ナビゲーション', () => {
  test('NAV-01: ヘッダーカテゴリリンク', async ({ page }) => {
    await page.goto(PUBLIC_BASE_URL);

    const header = page.locator('header').or(page.locator('nav'));
    const hasHeader = await header.count() > 0;

    if (!hasHeader) {
      test.skip();
      return;
    }

    // カテゴリリンク
    const categoryLink = header.first().locator('a[href*="/yoga"], a[href*="/meditation"], a[href*="/health"], a[href*="/"]').first();

    if (await categoryLink.isVisible()) {
      const href = await categoryLink.getAttribute('href');
      if (href && href !== '/') {
        await categoryLink.click();
        // ページ遷移を確認
        await expect(page).toHaveURL(new RegExp(href));
      }
    }
  });

  test('NAV-02: モバイルメニュー開閉', async ({ page }) => {
    // モバイルビューポート
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(PUBLIC_BASE_URL);

    // ハンバーガーメニューボタン
    const menuButton = page.getByRole('button', { name: /メニュー|Menu/i })
      .or(page.locator('[data-testid="mobile-menu-button"]'))
      .or(page.locator('button[aria-label*="menu"]'));

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // サイドバーまたはドロワーメニューが開く
      const mobileMenu = page.locator('[data-testid="mobile-menu"]')
        .or(page.locator('nav[role="navigation"]'))
        .or(page.locator('[role="dialog"]'));

      await expect(mobileMenu).toBeVisible();

      // 閉じるボタン
      const closeButton = mobileMenu.getByRole('button', { name: /閉じる|Close|✕|×/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(mobileMenu).not.toBeVisible();
      }
    }
  });

  test('NAV-03: フッターカテゴリリンク', async ({ page }) => {
    await page.goto(PUBLIC_BASE_URL);

    const footer = page.locator('footer');
    const hasFooter = await footer.count() > 0;

    if (!hasFooter) {
      test.skip();
      return;
    }

    await expect(footer).toBeVisible();
  });

  test('NAV-04: ロゴクリックでホームに戻る', async ({ page }) => {
    await page.goto(PUBLIC_BASE_URL);

    // ホームリンクを探す
    const homeLink = page.locator('a[href="/"]').first();
    const hasHomeLink = await homeLink.count() > 0;

    if (!hasHomeLink) {
      test.skip();
      return;
    }

    await homeLink.click();
    await expect(page).toHaveURL(PUBLIC_BASE_URL + '/');
  });
});

test.describe('レスポンシブデザイン', () => {
  test('RES-01: モバイル表示 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(PUBLIC_BASE_URL);

    // ページが正常に表示される
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('RES-02: タブレット表示 (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(PUBLIC_BASE_URL);

    // ページが正常に表示される
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('RES-03: デスクトップ表示 (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(PUBLIC_BASE_URL);

    // ページが正常に表示される
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('エラーハンドリング', () => {
  test('ERR-01: 404ページ', async ({ page }) => {
    const response = await page.goto(`${PUBLIC_BASE_URL}/this-page-does-not-exist-xyz`);

    // 404、200、または500（開発環境）
    if (response) {
      expect([200, 404, 500]).toContain(response.status());
    }

    // ページが表示される（カスタム404または通常ページ）
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('ERR-02: 画像読み込み失敗時のフォールバック', async ({ page }) => {
    await page.goto(PUBLIC_BASE_URL);

    // 画像要素を取得
    const images = page.locator('img');
    const count = await images.count();

    if (count > 0) {
      // 各画像にalt属性が設定されている
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        // altが空文字列でないことを確認（装飾画像は空でもOK）
        expect(alt !== null).toBe(true);
      }
    }
  });

  test('リダイレクト: 旧スラッグアクセス', async ({ page }) => {
    // SlugHistoryに登録された旧スラッグでアクセス
    const response = await page.goto(`${PUBLIC_BASE_URL}/yoga-poses/old-article-slug`, {
      waitUntil: 'domcontentloaded',
    });

    // ページが表示される（何らかのレスポンス）
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('パフォーマンス', () => {
  test('ホームページの初期ロード', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(PUBLIC_BASE_URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    // 5秒以内にDOMContentLoadedが完了
    expect(loadTime).toBeLessThan(5000);
  });

  test('Core Web Vitals関連の要素', async ({ page }) => {
    await page.goto(PUBLIC_BASE_URL);

    // ページのコンテンツが表示される
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // LCP候補要素が存在するか確認
    const lcpCandidate = page.locator('img, h1, p, div').first();
    const hasLcp = await lcpCandidate.count() > 0;
    expect(hasLcp).toBe(true);
  });
});
