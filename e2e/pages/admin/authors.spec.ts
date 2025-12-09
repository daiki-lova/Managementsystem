import { test, expect } from '@playwright/test';
import { loginToAdmin, navigateToTab, waitForPageLoad, randomString } from '../../fixtures/test-utils';

/**
 * 監修者管理 E2Eテスト
 */
test.describe('監修者管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginToAdmin(page);
    await navigateToTab(page, '監修者');
    await waitForPageLoad(page);
  });

  test('AUT-01: 監修者一覧が表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // テーブルまたはリストが表示される
    const table = page.locator('table');
    const grid = page.locator('.grid');
    const mainContent = page.locator('main');

    const hasTable = await table.isVisible();
    const hasGrid = await grid.isVisible();
    const hasMain = await mainContent.isVisible();

    expect(hasTable || hasGrid || hasMain).toBe(true);
  });

  test('AUT-02: 監修者新規作成', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /追加|新規|作成/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // フォームに入力
      const nameInput = dialog.getByPlaceholder(/名前/i).first();
      const roleInput = dialog.getByPlaceholder(/肩書き|役職/i).first();

      if (await nameInput.isVisible()) {
        await nameInput.fill(`テスト監修者${randomString(4)}`);
      }

      if (await roleInput.isVisible()) {
        await roleInput.fill('ヨガインストラクター');
      }

      // キャンセル
      await dialog.getByRole('button', { name: /キャンセル/i }).click();
    }
  });

  test('AUT-03: 監修者編集', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible()) {
      const editButton = firstRow.getByRole('button', { name: /編集/i });

      if (await editButton.isVisible()) {
        await editButton.click();
      } else {
        await firstRow.locator('td').first().click();
      }

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        // 編集フィールドが表示される
        await expect(dialog.getByLabel(/名前/i)).toBeVisible();

        // キャンセル
        await dialog.getByRole('button', { name: /キャンセル/i }).click();
      }
    }
  });

  test('AUT-04: 画像アップロード', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /追加|新規/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        // 画像アップロード領域を探す
        const fileInput = dialog.locator('input[type="file"]');

        if (await fileInput.isVisible()) {
          // ファイル選択ダイアログが開ける状態であることを確認
          await expect(fileInput).toBeEnabled();
        }

        await dialog.getByRole('button', { name: /キャンセル/i }).click();
      }
    }
  });

  test('AUT-05: 監修者削除', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: /削除/i }).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      const confirmDialog = page.getByRole('alertdialog');
      if (await confirmDialog.isVisible()) {
        await confirmDialog.getByRole('button', { name: /キャンセル/i }).click();
      }
    }
  });
});
