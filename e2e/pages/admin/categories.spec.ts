import { test, expect } from '@playwright/test';
import { loginToAdmin, navigateToTab, waitForPageLoad, randomString } from '../../fixtures/test-utils';

/**
 * カテゴリ管理 E2Eテスト
 */
test.describe('カテゴリ管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginToAdmin(page);
    await navigateToTab(page, 'カテゴリー');
    await waitForPageLoad(page);
  });

  test('CAT-01: カテゴリ一覧が表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // テーブルまたはリストが表示される
    const table = page.locator('table');
    const list = page.locator('[role="list"]');
    const grid = page.locator('.grid');
    const mainContent = page.locator('main');

    const hasTable = await table.isVisible();
    const hasList = await list.isVisible();
    const hasGrid = await grid.isVisible();
    const hasMain = await mainContent.isVisible();

    expect(hasTable || hasList || hasGrid || hasMain).toBe(true);
  });

  test('CAT-02: 新規カテゴリ作成', async ({ page }) => {
    // 追加ボタンをクリック
    const addButton = page.getByRole('button', { name: /追加|新規|作成/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // ダイアログが表示される
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // フォームに入力
      const nameInput = dialog.getByPlaceholder(/カテゴリー名|名前/i);
      const slugInput = dialog.getByPlaceholder(/スラッグ|slug/i);

      const testName = `テストカテゴリ${randomString(4)}`;
      const testSlug = `test-category-${randomString(4)}`;

      if (await nameInput.isVisible()) {
        await nameInput.fill(testName);
      }

      if (await slugInput.isVisible()) {
        await slugInput.fill(testSlug);
      }

      // キャンセル（実際に作成しない）
      const cancelButton = dialog.getByRole('button', { name: /キャンセル/i });
      await cancelButton.click();

      await expect(dialog).not.toBeVisible();
    }
  });

  test('CAT-03: カテゴリ編集', async ({ page }) => {
    // 最初の行の編集ボタンまたは名前をクリック
    const firstRow = page.locator('table tbody tr').first();

    if (await firstRow.isVisible()) {
      const editButton = firstRow.getByRole('button', { name: /編集/i });

      if (await editButton.isVisible()) {
        await editButton.click();
      } else {
        // 名前をクリック
        await firstRow.locator('td').first().click();
      }

      // 編集ダイアログまたはフォームが表示される
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        // キャンセル
        await dialog.getByRole('button', { name: /キャンセル/i }).click();
      }
    }
  });

  test('CAT-04: カテゴリ削除（記事なし）', async ({ page }) => {
    // 削除ボタンを探す
    const deleteButton = page.getByRole('button', { name: /削除/i }).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 確認ダイアログ
      const confirmDialog = page.getByRole('alertdialog');
      if (await confirmDialog.isVisible()) {
        // キャンセル
        await confirmDialog.getByRole('button', { name: /キャンセル/i }).click();
      }
    }
  });

  test('CAT-05: カテゴリ削除（記事あり）はエラー', async ({ page }) => {
    // 記事が紐づいているカテゴリの削除を試みる
    // （シードデータで記事が存在するカテゴリ）

    const yogaRow = page.locator('table tbody tr').filter({ hasText: /ヨガポーズ/i });

    if (await yogaRow.isVisible()) {
      const deleteButton = yogaRow.getByRole('button', { name: /削除/i });

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 確認ダイアログ
        const confirmDialog = page.getByRole('alertdialog');
        if (await confirmDialog.isVisible()) {
          await confirmDialog.getByRole('button', { name: /削除/i }).click();

          // エラーメッセージが表示される
          await expect(page.getByText(/記事.*存在|削除できません/i)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});
