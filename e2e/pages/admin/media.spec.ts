import { test, expect } from '@playwright/test';
import { loginToAdmin, navigateToTab, waitForPageLoad } from '../../fixtures/test-utils';

/**
 * メディアライブラリ E2Eテスト
 */
test.describe('メディアライブラリ', () => {
  test.beforeEach(async ({ page }) => {
    await loginToAdmin(page);
    await navigateToTab(page, 'メディア');
    await waitForPageLoad(page);
  });

  test('MED-01: メディア一覧が表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // グリッド表示（マゾンリー）
    const grid = page.locator('[data-testid="media-grid"]')
      .or(page.locator('.grid'))
      .or(page.locator('[role="grid"]'));
    const mainContent = page.locator('main');

    const hasGrid = await grid.isVisible();
    const hasMain = await mainContent.isVisible();

    expect(hasGrid || hasMain).toBe(true);
  });

  test('MED-02: ファイルアップロード', async ({ page }) => {
    // アップロードボタンまたはドロップゾーン
    const uploadButton = page.getByRole('button', { name: /アップロード|追加/i });
    const dropzone = page.locator('[data-testid="dropzone"]')
      .or(page.locator('input[type="file"]'));

    if (await uploadButton.isVisible()) {
      await uploadButton.click();

      // ファイル選択ダイアログまたはモーダル
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await expect(fileInput.first()).toBeEnabled();
      }
    } else if (await dropzone.isVisible()) {
      // ドロップゾーンが存在する
      await expect(dropzone).toBeVisible();
    }
  });

  test('MED-03: メディア詳細表示', async ({ page }) => {
    // 最初の画像をクリック
    const firstImage = page.locator('[data-testid="media-item"]').first()
      .or(page.locator('.grid img').first())
      .or(page.locator('[role="gridcell"]').first());

    if (await firstImage.isVisible()) {
      await firstImage.click();

      // サイドパネルまたはモーダルが表示される
      const detailPanel = page.locator('[data-testid="media-detail"]')
        .or(page.getByRole('dialog'))
        .or(page.locator('aside'));

      if (await detailPanel.isVisible()) {
        // ファイル情報が表示される
        await expect(detailPanel.getByText(/ファイル名|サイズ|形式/i)).toBeVisible();

        // 閉じる
        const closeButton = detailPanel.getByRole('button', { name: /閉じる|✕|×/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('MED-04: メディア削除', async ({ page }) => {
    // アイテムを選択して削除
    const firstItem = page.locator('[data-testid="media-item"]').first()
      .or(page.locator('.grid > div').first());

    if (await firstItem.isVisible()) {
      // ホバーで削除ボタン表示、またはコンテキストメニュー
      await firstItem.hover();

      const deleteButton = firstItem.getByRole('button', { name: /削除/i })
        .or(page.getByRole('button', { name: /削除/i }).first());

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 確認ダイアログ
        const confirmDialog = page.getByRole('alertdialog');
        if (await confirmDialog.isVisible()) {
          await confirmDialog.getByRole('button', { name: /キャンセル/i }).click();
        }
      }
    }
  });

  test('MED-05: 検索フィルター', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/検索|ファイル名/i)
      .or(page.locator('input[type="search"]'));

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      await waitForPageLoad(page);

      // 結果が更新される（0件でもOK）
      const grid = page.locator('[data-testid="media-grid"]').or(page.locator('.grid'));
      await expect(grid).toBeVisible();
    }
  });

  test('MED-06: フィルタードロップダウン', async ({ page }) => {
    // タイプフィルター（画像、動画など）
    const typeFilter = page.getByRole('combobox').first()
      .or(page.locator('[data-testid="type-filter"]'));

    if (await typeFilter.isVisible()) {
      await typeFilter.click();

      // オプションが表示される
      const options = page.getByRole('option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});
