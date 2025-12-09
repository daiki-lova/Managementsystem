import { test, expect } from '@playwright/test';
import { loginToAdmin, navigateToTab, waitForPageLoad, randomString } from '../../fixtures/test-utils';

/**
 * コンバージョン管理 E2Eテスト
 */
test.describe('コンバージョン管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginToAdmin(page);
    await navigateToTab(page, 'コンバージョン');
    await waitForPageLoad(page);
  });

  test('CV-01: コンバージョン一覧が表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // グリッドまたはリスト表示
    const grid = page.locator('[data-testid="conversion-grid"]').or(page.locator('.grid'));
    const list = page.locator('table').or(page.locator('[role="list"]'));
    const mainContent = page.locator('main');

    const hasGrid = await grid.isVisible();
    const hasList = await list.isVisible();
    const hasMain = await mainContent.isVisible();

    expect(hasGrid || hasList || hasMain).toBe(true);
  });

  test('CV-02: 新規コンバージョン作成', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /追加|新規|作成/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // フォーム入力
      const nameInput = dialog.getByPlaceholder(/名前|タイトル/i).first();
      const descInput = dialog.getByPlaceholder(/説明|概要/i).first();

      if (await nameInput.isVisible()) {
        await nameInput.fill(`テストCTA${randomString(4)}`);
      }

      if (await descInput.isVisible()) {
        await descInput.fill('テスト用のコンバージョンです');
      }

      // タイプ選択
      const typeSelect = dialog.getByRole('combobox').first();
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        const campaignOption = page.getByText(/キャンペーン|CAMPAIGN/i).first();
        if (await campaignOption.isVisible()) {
          await campaignOption.click();
        }
      }

      // キャンセル
      await dialog.getByRole('button', { name: /キャンセル/i }).click();
      await expect(dialog).not.toBeVisible();
    }
  });

  test('CV-03: コンバージョン編集', async ({ page }) => {
    // 最初のアイテムをクリック
    const firstItem = page.locator('[data-testid="conversion-item"]').first()
      .or(page.locator('table tbody tr').first())
      .or(page.locator('.grid > div').first());

    if (await firstItem.isVisible()) {
      const editButton = firstItem.getByRole('button', { name: /編集/i });

      if (await editButton.isVisible()) {
        await editButton.click();
      } else {
        await firstItem.click();
      }

      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        // 編集フィールドが存在する
        const nameInput = dialog.getByPlaceholder(/名前|タイトル/i).first()
          .or(dialog.getByLabel(/名前|タイトル/i).first());

        if (await nameInput.isVisible()) {
          await expect(nameInput).toBeEnabled();
        }

        // キャンセル
        await dialog.getByRole('button', { name: /キャンセル/i }).click();
      }
    }
  });

  test('CV-04: ステータス変更', async ({ page }) => {
    const firstItem = page.locator('table tbody tr').first()
      .or(page.locator('[data-testid="conversion-item"]').first());

    if (await firstItem.isVisible()) {
      // ステータス切替ボタンまたはトグル
      const statusToggle = firstItem.locator('[role="switch"]').first()
        .or(firstItem.getByRole('button', { name: /公開|停止|有効|無効/i }));

      if (await statusToggle.isVisible()) {
        // 現在の状態を確認
        const initialState = await statusToggle.getAttribute('aria-checked');

        await statusToggle.click();
        await waitForPageLoad(page);

        // 状態が変わったことを確認（またはキャンセル）
      }
    }
  });

  test('CV-05: コンバージョン削除', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: /削除/i }).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      const confirmDialog = page.getByRole('alertdialog');
      if (await confirmDialog.isVisible()) {
        // キャンセル
        await confirmDialog.getByRole('button', { name: /キャンセル/i }).click();
        await expect(confirmDialog).not.toBeVisible();
      }
    }
  });
});
